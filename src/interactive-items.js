class InteractiveSprite extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, frame, itemName=null, scale=.5, highlightTexture=null, highlightYOffset=0) {  
    super(scene, x, y, texture, frame).setScale(scale).setInteractive().setDepth(6);
    scene.add.existing(this); 

    if (useLighting) {
      this.setPipeline('Light2D');
    }

    // The highlight is added to a separate sprite so it can be displayed at a different depth 
    if (!highlightTexture) {
      this.highlight = scene.add.image(x, y, texture, frame).setScale(scale).setDepth(20).setAlpha(0.75);
      
      // The original sprite is used as a mask so only the highlight is visible
      var mask = this.createBitmapMask();
    } else {
      this.highlight = scene.add.image(x, y - highlightYOffset, highlightTexture).setScale(scale).setDepth(20).setAlpha(0.75);

      // Draw the highlight sprite again to use as a mask only
      var mask = scene.add.image(x, y - highlightYOffset, highlightTexture).setVisible(false).createBitmapMask();
    }

    // Hides the highlight so only the glowing edges will be visible
    mask.invertAlpha = true;
    this.highlight.setMask(mask);
    this.setHighlightColour();

    this.itemName = itemName;
    
    this.text = null;
    this.textBackground = null; 

    this.pickupDistance = 35;

    this.on('pointerover', function (pointer) {
      if (this.distanceToPlayer() < this.pickupDistance) {
        this.addHighlight();

        // Use pointer.x to get the position relative to the camera,
        this.addText(pointer);

        // This stops weapon firing when mouse over interacive things
        this.scene.player.overItem = true;
      }
    }.bind(this));
    
    this.on('pointerout', function () {
      this.removeHighlight();
      this.removeText();
      this.scene.player.overItem = false;  
    }.bind(this));

    this.on('pointerdown', function(pointer) { 
      if (this.distanceToPlayer() < this.pickupDistance) {  
        this.onPointerDown(pointer);
      }
    }.bind(this))
  }

  distanceToPlayer() {
    return Phaser.Math.Distance.BetweenPoints(this.getCenter(), this.scene.player.getCenter())
  }
 
  addText(pointer) {
    // Tooltip text, set the depth to a large number so it is always on top. Is it neccessary to have 
    // a text object for each item?
    this.text = this.scene.add.bitmapText(pointer.worldX + 8, pointer.worldY, 'meyrin', this.getText(), displayTextSize).setDepth(1000);
    this.textBackground = this.scene.add.graphics(); 

    // Get the bounds of the text so the background colour can be made the same shape, the last value 
    // adjusts the rounding of the corners
    const textBounds = this.text.getTextBounds(true);
    this.textBackground.fillRoundedRect(
      textBounds.global.x, 
      textBounds.global.y, 
      textBounds.global.width, 
      textBounds.global.height, 
      8
    ).setDepth(999).fillStyle(0x000000, 0.75);
  }

  removeText () {
    if (this.text != null)
      this.text.destroy();
    if (this.textBackground != null)
      this.textBackground.destroy();
  }

  removeItem() {
    this.scene.player.overItem = false; 
    this.removeText();
    this.removeHighlight();
    this.destroy();
  }

  addHighlight() {
    // Add postfx pipeline
    this.scene.postFxPlugin.add(this.highlight, {
      thickness: 1,
      outlineColor: this.getHighlightColour()[0]
    });
    this.scene.postFxPlugin.add(this.highlight, {
      thickness: 3,
      outlineColor: this.getHighlightColour()[1]//0xf0e878 //0xff8a50
    });
  }

  removeHighlight() {
    // Remove all outline post-fx pipelines
    this.scene.postFxPlugin.remove(this.highlight);
  }

  getHighlightColour() {
    return this.highlightColour;
  }

  setHighlightColour(colour) {
    if (colour == null) {
      this.highlightColour = [0xf0e878, 0xfaeb16];
    } else {
      this.highlightColour = colour;
    }
  }
}

class Door extends InteractiveSprite {
  constructor(scene, x, y, id) { 
    super(scene, x, y, 'doors', id + 7, null, 1, 'doors-full', 8).setDepth(4);
    this.doorIndex = id;

    // To make the depth sorting consistent with the tilemap the top and bottom parts of the door are drawn separately
    this.doorTop = this.scene.add.sprite(x, y - tileSize, 'doors', id).setDepth(9);
    
    if (useLighting) {
      this.setPipeline('Light2D');
      this.doorTop.setPipeline('Light2D');
    }

    this.setAudio();
    this.addAnimation();

    // Change the hit area of the lower part of the door so it covers to top part also
    this.input.hitArea.setTo(0, -this.displayHeight, this.displayWidth, 2*this.displayHeight);
  }

  setAudio() {
    // Add the sound effect handler with the open and close noise
    this.soundRange = this.scene.soundColliders.get();        
    this.soundRange.setTarget(this);
    this.soundRange.setEnable(false);
    this.soundRange.addAudio('door-open-2', 100, 400);
    this.soundRange.addAudio('door-close-2', 100, 400);
  }

  setParameters(orientation, keyType) {
    this.flipX = (orientation == 'right');
    this.doorTop.flipX = (orientation == 'right');
    
    this.state = (keyType != 0) + 1; // 0 is open, 1 is closed, 2 is locked
    this.keyType = keyType - 1; // The key sprites are numbered 0..2, but 0 denotes unlocked door so subtract one

    if (keyType == 1) {
      this.setHighlightColour([0x212969, 0x495af3]);
    } else if (keyType == 2) {
      this.setHighlightColour([0x9b0d0d, 0xe6147a]);
    } else if (keyType == 3) {
      this.setHighlightColour([0x0e5f02, 0x199108]);
    }

    this.updatePathfinding();
  }

  addAnimation() {      
    // On click play the open door animation defined in the TopDownShooter class. The body needs to be dis/enabled 
    // so you can got through it
    this.animationUpper = 'open_upper_' + this.doorIndex;
    this.animationLower = 'open_lower_' + this.doorIndex;
  }

  getText() {
    if (this.state == 0) {
      return 'close';
    } else if (this.state == 1) {
      return 'open';
    } else if (gameState.inventory['keys'].includes(this.keyType)) {
      return 'unlock'
    } else {
      return 'it\'s locked';
    }               
  }

  onPointerDown(pointer) {
    if (this.state == 0) {
      this.closeDoor();
      this.removeText();
      this.addText(pointer);
    } else if (this.state == 1) {
      this.openDoor();
      this.removeText();
      this.addText(pointer);
    } else if (gameState.inventory['keys'].includes(this.keyType)) {
      this.unlockDoor();
      this.removeText();
      this.addText(pointer);
    } else {
      // locked door function
    }
    this.updatePathfinding();
  }

  openDoor() {
    this.state = 0;
    this.soundRange.playSound('door-open-2');
    this.doorTop.anims.stop();
    this.anims.stop();
    this.doorTop.anims.play(this.animationUpper, true);
    this.anims.play(this.animationLower, true); 
    this.doorTop.setDepth(4); // Set depth so player is in front of upper and lower parts of door when it's open
    this.body.enable = false;
  }

  closeDoor() {
    this.state = 1;
    this.soundRange.playSound('door-close-2'); 
    this.doorTop.anims.stop();
    this.anims.stop();
    this.doorTop.anims.playReverse(this.animationUpper, true);
    this.anims.playReverse(this.animationLower, true);                  
    this.doorTop.setDepth(9);
    this.body.enable = true;
  }

  unlockDoor() {
    this.state = 1; // The door is closed but not locked
    this.setHighlightColour();
    // Play unlock sound
    // if (gameState.inventory['keys'].includes(this.keyType)) {
    //   this.openDoor()
    // } else {
    //   // play locked door sound 
    // }
  }

  updatePathfinding() {
    const gridPoint = this.scene.worldPosToTile(this.x, this.y); 
    if (this.state == 0) {
      this.scene.finder.stopAvoidingAdditionalPoint(gridPoint.x, gridPoint.y); // Make this tile passable when door is open
    } else {
      this.scene.finder.avoidAdditionalPoint(gridPoint.x, gridPoint.y);
    }
  }  

  getTargetLocation() {
    return new Phaser.Math.Vector2(this.x, this.y);
  }
}

class CollectableItem extends InteractiveSprite {
  onPointerDown() {
    this.scene.scene.get('UIOverlay').collectItem(this.scene.collectableTarget, this.scene.collectableScore);
    this.removeItem();
  }

  getText() {
    return 'collect'
  }
}

class KeyItem extends InteractiveSprite {
  constructor(scene, x, y, keyType) {  
    super(scene, x, y, 'items', `key-${keyType}.png`, null, 0.1);
    this.keyType = keyType;
  }

  onPointerDown() {
    this.scene.scene.get('UIOverlay').collectKey(this.keyType)//this.scene.collectableTarget, this.scene.collectableScore);
  
    this.removeItem();
  }

  getText() {
    return 'collect'
  }
}

class WeaponItem extends InteractiveSprite {
  constructor(scene, x, y, weaponName, ammo) {  
    super(scene, x, y, 'weapons', `${weaponName}.png`, '', .2);
    
    const weaponParameters = this.scene.cache.json.get('weaponParameters')
    
    if (ammo == null && weaponParameters[weaponName].capacity){
      ammo = Phaser.Math.RND.between(0, weaponParameters[weaponName].capacity);
    }
    this.weapon = weaponName;
    this.ammo = ammo;
    this.ammoType = weaponParameters[weaponName].ammoType;
  }

  onPointerDown() {
    if (gameState.inventory.equippedWeapon != this.weapon) {
      gameState.inventory.equippedWeapon = this.weapon;
      if (this.ammo) {
        gameState.inventory.ammo[this.ammoType] += this.ammo;
      }
      this.scene.player.equipWeapon(this.weapon);   
      this.removeItem(); 
    }	else {
      if (this.ammo) {
        gameState.inventory.ammo[this.ammoType] += this.ammo;
        this.ammo = 0;
        this.scene.scene.get('UIOverlay').updateAmmo(this.ammoType); 
      }
    }
  }
  
  getText() {
    if (gameState.inventory.equippedWeapon == this.weapon) {
      return 'take ammo';
    } else {
      return 'equip'
    }
  }
}

class AmmoItem extends InteractiveSprite {
  constructor(scene, x, y) {  
    super(scene, x, y, 'items', 'ammo-0.png', '', .6);
    
    this.ammo = { 
      'pistol': Phaser.Math.RND.between(2, 10), 
      'shotgun': Phaser.Math.RND.between(2, 6),
      'rifle': Phaser.Math.RND.between(4, 12)
    }
  }

  onPointerDown() {  
    for (var key of Object.keys(this.ammo)) {
      gameState.inventory.ammo[key] += this.ammo[key];
    }

    // Load data from JSON to find equipped weapon type, do this in a better way?
    const weaponParameters = this.scene.cache.json.get('weaponParameters');
    const ammoType = weaponParameters[gameState.inventory.equippedWeapon]['ammoType'];
    this.scene.scene.get('UIOverlay').updateAmmo(ammoType); 

    this.removeItem();
  }
  
  getText() {
    return 'take ammo';
  }
}

class Light extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, parameters) { 
    super(scene, x, y);
    scene.physics.add.existing(this); 
    createCircleBody(this.body, 1.5*parameters.radius);
    this.light = scene.lights.addLight(x, y, parameters.radius, parameters.colour, parameters.intensity);
  }

  updatePosition(x, y) {
    this.setPosition(x, y);    
    this.light.setPosition(x, y);
  }
}

function createCircleBody(body, radius) {
  // The default origin when setting a circle body is at the the top left corner of an inscribed square (which
  // has width sqrt(2)*radius), to put it in the centre of the circle offset by sqrt(2)/2*radius
  body.setCircle(
    radius,
    -0.707*radius, // x offset
    -0.707*radius // y offset
  ); 
};