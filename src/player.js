class Player extends Phaser.Physics.Arcade.Sprite {  
  constructor(scene, x, y) {  
    super(scene, x, y, 'assistant', 11).setDepth(7).setOrigin(0.5, 1);
        
    // These two bits are neccessary to get the sprite and sprite body to display. Can they be combined
    // into a single line?
    scene.add.existing(this); 
    scene.physics.add.existing(this); 
    this.body.setSize(14, 16, true); // Set size smaller than sprite so it overlaps things behind it. Can this be done another way?
    this.body.setOffset(5, 16);

    this.body.setDrag(1000);
    this.body.overlapX = 20;
    this.body.overlapY = 20;

    this.runSpeed = 120;
    this.sneakSpeed = 40;
    this.movementSpeed = this.runSpeed;

    // Set camera size and make it follow the player
    scene.cameras.main.startFollow(this);
    scene.cameras.main.setSize(640, 360);
    scene.cameras.main.setZoom(3);

    // Movement keys
    this.left = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.down = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.right = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.up = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    // wasd = {                up: game.input.keyboard.addKey(Phaser.Keyboard.W),                down: game.input.keyboard.addKey(Phaser.Keyboard.S),                left: game.input.keyboard.addKey(Phaser.Keyboard.A),                right: game.input.keyboard.addKey(Phaser.Keyboard.D),            };

    // Action keys
    this.pause = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.spaceBar = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.xKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);

    // Load health from gameState, this is only used for changing scenes, should it be?
    this.health = gameState.health;
    this.weaponEquipped = false;

    /////////////////////////////////////// stop right button doni stuff
    this.scene.input.mouse.disableContextMenu();

    // Fires weapon on left click of mouse
    this.overItem = false;
    this.scene.input.on('pointerdown', function (pointer) {
      if (pointer.rightButtonDown()) {
        this.switchWeapons();
      } else {
        if (this.weaponEquipped && !this.overItem && this.weapon.canAttack()){ 
          this.weapon.attack(pointer); // startAt 0 doesn't do what I want so run the callback once before the timer
          this.timer = this.scene.time.addEvent({
            startAt: 0,
            delay: this.weapon.attackSpeed,
            loop: true,
            callback: () => {
              this.weapon.attack(pointer)
            }
          }, this);                      
        }
      }      
    }, this);
    this.scene.input.on('pointerup', function (pointer) {
      this.timer.remove();
    }, this);

    if (useLighting){
      this.setPipeline('Light2D');
      this.light = this.scene.lightSources.create(x, y, { 'radius': 60, 'colour': 0xf0f0c2, 'intensity': 0.8 });
    };
    // this.toggleLight();
    // this.light.setVisible(false);

    if (gameState.inventory.equippedWeapon != null) {
      this.equipWeapon(gameState.inventory.equippedWeapon, false);
    }
    this.weaponXOffset = 11;
    // this.scene.add.sprite(x, y, 'weapons', 'revolver-0.png')

    this.soundRange = scene.soundColliders.get();
    this.soundRange.setTarget(this);
    
    // const direction = ['down', 'right', 'left', 'up']; 

    // for (var i = 0; i < direction.length; i++) { 
    //   this.anims.create({
    //     key: `assistant_move_${direction[i]}`,
    //     frames: this.anims.generateFrameNumbers('assistant', {start: 3*i, end: 3*i + 2}),
    //     frameRate: 8
    //   });
    // }

  //   const solidGround = {
  //     start: 0,
  //     duration: 4,
  //     config: {
  //       mute: false,
  //       volume: 1,
  //       rate: 1,
  //       detune: 0,
  //       seek: 0,
  //       loop: false,
  //       delay: 0
  //   }
  // }

    // var music = this.scene.sound.add('footsteps');
    this.on('animationstart', function () {
      this.scene.audio['footsteps'].play()
      // this.scene.sound.play('footsteps', solidGround);
      // console.log("HI");
      // if(this.player.anims.currentAnim.key === 'walking') {
      //   this.sound.play('playerStep');
      // }
    });

    this.on('animationcomplete', function () {
      // console.log("WHHH");
      this.scene.audio['footsteps'].stop();
    });

    // overlapstart and overlap end are emitted during update
    this.on("overlapstart", function() {
      this.movementSpeed = 60;
    });
    this.on("overlapend", function() {
      this.movementSpeed = this.runSpeed;
    });
  }

  equipWeapon(weaponName='revolver-0', updateUi=true, drop=true) {
    // Add display item to game so it can be picked up again
    if (this.weapon) {
      if (drop) { 
        this.weapon.drop();
      } else {
        this.weapon.destroySprite();
      }
    }

    this.weaponEquipped = true;
    const weaponParameters = this.scene.cache.json.get('weaponParameters');
    this.weapon = weaponParameters[weaponName].type == 'ranged' ? new RangedWeapon(this.scene, this.x, this.y, weaponName, 0) : new MeleeWeapon(this.scene, this.x, this.y, weaponName, 0);

    // During initial scene creation the UI scene will only be made after the player, so avoid calling it
    if (updateUi) {
      this.scene.scene.get('UIOverlay').equipWeapon(this.weapon);
    }
  }

  switchWeapons() {
    const weaponToEquip = gameState.inventory.secondaryWeapon;        
    gameState.inventory.secondaryWeapon = gameState.inventory.equippedWeapon;
    gameState.inventory.equippedWeapon = weaponToEquip;

    this.equipWeapon(weaponToEquip, true, false);
  }

  update() {    
    // Movement controls. Would it be more efficient to use if statements for each direction button combination? 
    let xSpeed = this.right.isDown*this.movementSpeed - this.left.isDown*this.movementSpeed;
    let ySpeed = this.down.isDown*this.movementSpeed - this.up.isDown*this.movementSpeed;

    // This makes sure the speed is the same when travelling diagonally
    if (Math.abs(xSpeed) > 0 && Math.abs(ySpeed) > 0) {
      xSpeed /= 1.415;
      ySpeed /= 1.415;
    }

    this.setVelocityX(xSpeed);
    this.setVelocityY(ySpeed);

    // Could be better to set animation when key press detected but this won't deal with diagonal movement so well
    if (this.body.velocity.x > 10 & Math.abs(this.body.velocity.x) >= Math.abs(this.body.velocity.y)){
				this.anims.play('assistant_move_left', true);
        this.weapon.setDepth(8);
        this.weaponXOffset = 7;
			} else if (this.body.velocity.x < -10 & Math.abs(this.body.velocity.x) >= Math.abs(this.body.velocity.y)){
				this.anims.play('assistant_move_right', true);
        this.weapon.setDepth(6);
        this.weaponXOffset = 4;
			} else if (this.body.velocity.y > 10 & Math.abs(this.body.velocity.y) >= Math.abs(this.body.velocity.x)){
				this.anims.play('assistant_move_down', true);
        this.weapon.setDepth(8);
        this.weaponXOffset = 2.5;
			} else if (this.body.velocity.y < -10 & Math.abs(this.body.velocity.y) >= Math.abs(this.body.velocity.x)){
				this.anims.play('assistant_move_up', true);
        this.weapon.setDepth(6);
        this.weaponXOffset = 11;
			} else {
				// this.anims.play('`${this.spriteName}_idle', true);
			}

    if (Phaser.Input.Keyboard.JustDown(this.pause)) {
      this.scene.scene.launch('Menu', {menuType: 'pause', menuTitle: 'Paused', currentScene: this.scene.scene});
    }
    
    if (Phaser.Input.Keyboard.JustDown(this.spaceBar)) {  
      this.toggleSneak();
    }

    if (Phaser.Input.Keyboard.JustDown(this.xKey)) {  
      this.toggleLight();
    }

    if (this.weaponEquipped) {
      this.weapon.update(this);
      // this.weapon.rotation = Phaser.Math.Angle.Between(this.x, this.y, this.scene.input.mousePointer.worldX, this.scene.input.mousePointer.worldY);
      // if (this.weapon.rotation > Math.PI/2 || this.weapon.rotation <= -Math.PI/2) {
      //   this.weapon.setFlipY(true);
      // } else {
      //   this.weapon.setFlipY(false);
      // }
      // this.weapon.x = this.body.x + this.weaponXOffset;
      // this.weapon.y = this.body.y + 9;
    }

    this.light.updatePosition(this.body.x, this.body.y);
    centerBodyOnBody(this.soundRange.body, this.body); // Add update position method light with light?

    // Set the distance player can be "heard" based on speed, could this be simplified using sneakToggle()?
    if (this.body.speed > this.sneakSpeed) {
      this.soundRange.setRadius(25);
    } else { 
      this.soundRange.setRadius(5);
    }

    // Check for entering and exiting colliders
    this.overlapCheck();
  }
    
  overlapCheck() {
    let touching = !this.body.touching.none;
    let wasTouching = !this.body.wasTouching.none;
  
    if (touching && !wasTouching) this.emit("overlapstart");
    else if (!touching && wasTouching) this.emit("overlapend");
  }

  toggleSneak() {
    if (this.movementSpeed == this.runSpeed) {
      this.movementSpeed = this.sneakSpeed;
      // this.anims.msPerFrame = 20;
      // TODO: switch animation
    } else {
      this.movementSpeed = this.runSpeed;
    }
  }

  toggleLight() {
    if (this.light.light.intensity == 0.8) {
      this.light.light.setIntensity(0.1);
      this.light.body.setEnable(false);
    } else {
      this.light.light.setIntensity(0.8);
      this.light.body.setEnable(true);
    }
  }

  reduceHealth(amount) {
    if (gameState.health > 0) {            
      gameState.health = gameState.health - amount;
      this.scene.scene.get("UIOverlay").setHealthBarPercent(gameState.health);
      this.scene.audio['body-hit'].play();
      if (gameState.health == 0) {
        this.killPlayer();
      }
    }
  }

  killPlayer() { 
    this.scene.scene.launch('Menu', { menuType: 'fail', menuTitle: 'you died', currentScene: this.scene.scene });
    // this.scene.scene.get('UIOverlay').resetState();
  }

  

  getTargetLocation() {
    // This is for path finding; the upper part of the player will overlap some impassible tiles, so set 
    // the target location in the lower part??
    const centre = this.getCenter();
    return new Phaser.Math.Vector2(centre.x, centre.y); // replace with this.x this.y set enemy origin to bottom of srpite
  }
}

class Weapon extends Phaser.Physics.Arcade.Image {
  constructor(scene, x, y, weaponName) {  
    super(scene, x, y, 'weapons', `${weaponName}.png`).setDepth(6).setPipeline('Light2D').setScale(.2);
   
    scene.add.existing(this); 

    this.lastUsed = 0; // The time the weapon was last used

    this.soundRange = scene.soundColliders.get();
    this.soundRange.setTarget(this);
    this.soundRange.setEnable(false);

    this.setParameters(weaponName);
  }

  setParameters(weaponName) {
    this.weaponName = weaponName;
    const weaponParameters = this.scene.cache.json.get('weaponParameters');

    this.attackSpeed = weaponParameters[weaponName].speed; // Minimum number of milliseconds between each attack
    this.bulletsPerShot = weaponParameters[weaponName].bullets;
    this.damage = weaponParameters[weaponName].damage;
    this.accuracy = weaponParameters[weaponName].accuracy;
    this.ammoType = weaponParameters[weaponName].ammoType;
    this.audio = weaponParameters[weaponName].audio;
    this.soundRange.addAudio(`${this.audio}-shot`, weaponParameters[weaponName].volume, weaponParameters[weaponName].duration);
    // this.soundRange.addAudio(`${this.ammoType}-empty`, 10, 100);

    // 
  }

  getName() {
    return this.weaponName;
  }

  drop() {
    new WeaponItem(this.scene, this.x, this.y, this.getName(), 0); // Create display item of the same type (with no ammo)
    this.destroySprite();
  }

  destroySprite() {
    this.soundRange.setActive(false); // Make this inactive so it can be reused for the next item equipped
    this.destroy();
  }

  getTargetLocation() {
    return this.getCenter();
  }

  canAttack() {
    return this.scene.time.now - this.lastUsed > this.attackSpeed
  }

  update(player) {
    // make this better!!
    this.rotation = Phaser.Math.Angle.Between(player.x, player.y, player.scene.input.mousePointer.worldX, player.scene.input.mousePointer.worldY);
      if (this.rotation > Math.PI/2 || this.rotation <= -Math.PI/2) {
        this.setFlipY(true);
      } else {
        this.setFlipY(false);
      }
      this.x = player.body.x + player.weaponXOffset;
      this.y = player.body.y + 9;
  }
}

class MeleeWeapon extends Weapon {
  constructor(scene, x, y, weapon, ammo) {  
    super(scene, x, y, weapon, ammo);
    this.type = 'melee';
    scene.physics.add.existing(this); 

    // Set up collider for melee attacks
    scene.physics.add.collider(this, scene.enemies, function(weapon, enemy) {     
      enemy.receiveDamage(weapon.damage); 
      this.body.enable = false;
    }.bind(this));

    this.isAttacking = false;
    this.body.enable = false;
  }

  attack(pointer){ 
    this.isAttacking = true;
    const initialRotation = this.rotation;

    // Use tween to swing weapon, could use this.scene.tweens.createTimeline() to chain tweens together but 
    // addCounter is needed ot get the angles right
    this.swingTween(initialRotation, initialRotation - 1.4, 200, function () {        
      this.body.enable = true; // Only enable the body on the downward swing
      this.swingTween(initialRotation - 1.4, initialRotation + 2.4, 50, function () {  
        this.body.enable = false;
        this.swingTween(initialRotation + 1.4, initialRotation, 100, function () { 
          this.isAttacking = false;
          this.lastUsed = this.scene.time.now; // Update the last time the weapon was used
        }.bind(this))
      }.bind(this)) 
    }.bind(this));
  }

  swingTween(from, to, duration, callback) {
    this.scene.tweens.addCounter({
      from: from,
      to: to,
      duration: duration,   
      onUpdate: function (tween) {
        this.rotation = tween.getValue();
      }.bind(this),
      onComplete: function (tween) {
        callback();
      }
    });
  }

  update(player) {
    if (!this.isAttacking) {
      let pointer = player.scene.input.mousePointer;
      this.rotation = Phaser.Math.Angle.Between(player.x, player.y, pointer.worldX, pointer.worldY);
    }
      if (this.rotation > Math.PI/2 || this.rotation <= -Math.PI/2) {
        this.setFlipY(true);
      } else {
        this.setFlipY(false);
      }
      this.x = player.body.x + player.weaponXOffset;
      this.y = player.body.y + 9;

      let direction = new Phaser.Math.Vector2();
      direction.setToPolar(this.rotation, 50);

      // find vector from this pos to mouse normalise multiply by N and add set as bory origin
      this.body.setCircle(
        10,
        direction.x,
        direction.y
      );
    
    // this.body.x = this.x;
    // this.body.y = this.y;
  }
}

class RangedWeapon extends Weapon {
  constructor(scene, x, y, weaponName, ammo) {  
    super(scene, x, y, weaponName, ammo);
    this.type = 'ranged';
  }

  attack(pointer) {
    if (gameState.inventory.ammo[this.ammoType] > 0) {
      // if (this.scene.time.now - this.lastUsed > this.attackSpeed) {
        this.soundRange.playSound(`${this.audio}-shot`);//this.audioFileName);  
        this.scene.cameras.main.shake(100, .005, false);
        
        let flash = this.scene.lights.addLight(this.x, this.y, 80, 0xf6f0c2, 1.4);

        this.scene.tweens.add({
          targets: flash,
          intensity: 0.1,
          duration: 80,
          // yoyo: true,
          // ease: 'Sine.easeInOut',
          // repeat: -1,
          onComplete: function (tween) {
            this.scene.lights.removeLight(flash);
          }.bind(this)
        });

        this.updateAmmo();

        for (var i = 0; i < this.bulletsPerShot; i++){                
          // Get bullet from bullets group
          var bullet = this.scene.playerBullets.get(this.damage).setActive(true).setVisible(true);
          bullet.fire(this, pointer, this.accuracy);
        }
        // Update the last time the weapon was fired
        this.lastUsed = this.scene.time.now;
      // }
    } else {
      // This is not player via the sound collider cos you don't want enemies to hear it
      this.scene.audio[`${this.ammoType}-empty`].play(); 
    }  
  }
    
  updateAmmo(amount=-1) {
    gameState.inventory.ammo[this.ammoType] += amount
    this.scene.scene.get('UIOverlay').updateAmmo(this.ammoType); 
  }
}

class Bullet extends Phaser.Physics.Arcade.Sprite { //Phaser.GameObjects.Image {
  constructor(scene, damage=1) {
    super(scene, 0, 0, 'weapons', 'bullet-0.png').setDepth(7).setScale(.3);

    // These two bits are neccessary to get the sprite and sprite body to display. Can they be combined
    // into a single line?
    scene.add.existing(this); 
    scene.physics.add.existing(this); 
    this.speed = 400;
    this.born = 0;
    this.xSpeed = 0;
    this.ySpeed = 0;
    this.setSize(50, 50, true); // This sets the size and shape of the body
    this.damage = damage;
  }

  // Fires a bullet from the shooter to the target
  fire(shooter, target, accuracy) {
    // TODO: make this position the end of the weapon
    this.setPosition(shooter.x, shooter.y); // Initial position
    const direction = Math.atan2((this.x - target.worldX), (this.y - target.worldY)) + Phaser.Math.FloatBetween(-accuracy, accuracy); // A bit of noise is added to the direction
    
    // Calculate X and y velocity of bullet to move it from shooter to target
    this.setVelocity(
      -this.speed*Math.sin(direction),
      -this.speed*Math.cos(direction)
    );

    this.rotation = shooter.rotation; // Angle bullet with shooter's rotation
    this.born = 0; // Time since new bullet spawned
  }

  // Destroys bullet after some time
  update(time, delta) {
    this.born += delta;
    if (this.born > 1800) {            
      this.destroy();
    }
  }

  // removeBullet() {
  //   this.setActive(false);
  //   this.setVisible(false);
  // }
}

// class InteractiveSprite extends Phaser.Physics.Arcade.Sprite {
//   constructor(scene, x, y, texture, frame, itemName=null, scale=.5, highlightTexture=null, highlightYOffset=0) {  
//     super(scene, x, y, texture, frame).setScale(scale).setInteractive().setDepth(6).setPipeline('Light2D');
//     scene.add.existing(this); 

//     // The highlight is added to a separate sprite so it can be displayed at a different depth 
//     if (!highlightTexture) {
//       this.highlight = scene.add.image(x, y, texture, frame).setScale(scale).setDepth(20).setAlpha(0.75);
      
//       // The original sprite is used as a mask so only the highlight is visible
//       var mask = this.createBitmapMask();
//     } else {
//       this.highlight = scene.add.image(x, y - highlightYOffset, highlightTexture).setScale(scale).setDepth(20).setAlpha(0.75);

//       // Draw the highlight sprite again to use as a mask only
//       var mask = scene.add.image(x, y - highlightYOffset, highlightTexture).setVisible(false).createBitmapMask();
//     }

//     // Hides the highlight so only the glowing edges will be visible
//     mask.invertAlpha = true;
//     this.highlight.setMask(mask);
//     this.setHighlightColour();

//     this.itemName = itemName;
    
//     this.text = null;
//     this.textBackground = null; 

//     const pickupDistance = 35;

//     this.on('pointerover', function (pointer) {
//       if (this.distanceToPlayer() < pickupDistance) {
//         this.addHighlight();

//         // Use pointer.x to get the position relative to the camera,
//         this.addText(pointer);

//         // This stops weapon firing when mouse over interacive things
//         this.scene.player.overItem = true;
//       }
//     }.bind(this));
    
//     this.on('pointerout', function () {
//       this.removeHighlight();
//       this.removeText();
//       this.scene.player.overItem = false;  
//     }.bind(this));

//     this.on('pointerdown', function(pointer) { 
//       if (this.distanceToPlayer() < pickupDistance) {  
//         this.onPointerDown(pointer);
//       }
//     }.bind(this))
//   }

//   distanceToPlayer() {
//     return Phaser.Math.Distance.BetweenPoints(this.getCenter(), this.scene.player.getCenter())
//   }
 
//   addText(pointer) {
//     // Tooltip text, set the depth to a large number so it is always on top. Is it neccessary to have 
//     // a text object for each item?
//     this.text = this.scene.add.bitmapText(pointer.worldX + 8, pointer.worldY, 'meyrin', this.getText(), displayTextSize).setDepth(1000);
//     this.textBackground = this.scene.add.graphics(); 

//     // Get the bounds of the text so the background colour can be made the same shape, the last value 
//     // adjusts the rounding of the corners
//     const textBounds = this.text.getTextBounds(true);
//     this.textBackground.fillRoundedRect(
//       textBounds.global.x, 
//       textBounds.global.y, 
//       textBounds.global.width, 
//       textBounds.global.height, 
//       8
//     ).setDepth(999).fillStyle(0x000000, 0.75);
//   }

//   removeText () {
//     if (this.text != null)
//       this.text.destroy();
//     if (this.textBackground != null)
//       this.textBackground.destroy();
//   }

//   removeItem() {
//     this.removeText();
//     this.removeHighlight();
//     this.destroy();
//   }

//   addHighlight() {
//     // Add postfx pipeline
//     this.scene.postFxPlugin.add(this.highlight, {
//       thickness: 1,
//       outlineColor: this.getHighlightColour()[0]
//     });
//     this.scene.postFxPlugin.add(this.highlight, {
//       thickness: 3,
//       outlineColor: this.getHighlightColour()[1]//0xf0e878 //0xff8a50
//     });
//   }

//   removeHighlight() {
//     // Remove all outline post-fx pipelines
//     this.scene.postFxPlugin.remove(this.highlight);
//   }

//   getHighlightColour() {
//     return this.highlightColour;
//   }

//   setHighlightColour(colour) {
//     if (colour == null) {
//       this.highlightColour = [0xf0e878, 0xfaeb16];
//     } else {
//       this.highlightColour = colour;
//     }
//   }
// }

// class CollectableItem extends InteractiveSprite {
//   onPointerDown() {
//     this.scene.scene.get('UIOverlay').collectItem(this.scene.collectableTarget, this.scene.collectableScore);
//     this.scene.player.overItem = false; 
//     this.removeItem();
//   }

//   getText() {
//     return 'collect'
//   }
// }

// class KeyItem extends InteractiveSprite {
//   onPointerDown() {
//     this.scene.scene.get('UIOverlay').collectKey(this.frame.name)//this.scene.collectableTarget, this.scene.collectableScore);
  
//     this.scene.player.overItem = false; 
//     this.removeItem();
//   }

//   getText() {
//     return 'collect'
//   }
// }

// class WeaponItem extends InteractiveSprite {
//   constructor(scene, x, y, weaponName, ammo) {  
//     super(scene, x, y, 'weapons', `${weaponName}.png`, '', .3);
    
//     const weaponParameters = this.scene.cache.json.get('weaponParameters')
    
//     if (ammo == null && weaponParameters[weaponName].capacity){
//       ammo = Phaser.Math.RND.between(0, weaponParameters[weaponName].capacity);
//     }
//     this.weapon = weaponName;
//     this.ammo = ammo;
//     this.ammoType = weaponParameters[weaponName].ammoType;
//   }

//   onPointerDown() {
//     if (gameState.inventory.weapon != this.weapon) {
//       gameState.inventory.weapon = this.weapon;
//       if (this.ammo) {
//         gameState.inventory.ammo[this.ammoType] += this.ammo;
//       }
//       this.scene.player.equipWeapon(this.weapon);     
//       this.scene.player.overItem = false;  
//       this.removeItem(); 
//     }	else {
//       if (this.ammo) {
//         gameState.inventory.ammo[this.ammoType] += this.ammo;
//         this.ammo = 0;
//         this.scene.scene.get('UIOverlay').updateAmmo(this.ammoType); 
//       }
//     }
//   }
  
//   getText() {
//     if (gameState.inventory.weapon == this.weapon) {
//       return 'take ammo';
//     } else {
//       return 'equip'
//     }
//   }
// }

