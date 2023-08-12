class UIOverlay extends Phaser.Scene {
	constructor() {
		super({key: 'UIOverlay'})		
	}

  preload() {
    this.load.image('left-cap', 'assets/sprites/display/health-bar/bar_left.png');
    this.load.image('middle', 'assets/sprites/display/health-bar/bar_mid.png');
    
    this.load.image('left-cap-shadow', 'assets/sprites/display/health-bar/bar_left_shadow.png');
    this.load.image('middle-shadow', 'assets/sprites/display/health-bar/bar_mid_shadow.png');

    this.load.image('hud-background', 'assets/sprites/display/backgrounds/hud-background.png');

    this.load.spritesheet('ui-display',
      'assets/sprites/display/backgrounds/ui-display.png',
      { frameWidth: 16, frameHeight: 32 }
    );
  }

	init() {
		this.maxSeconds = 1200; // Time limit in seconds
		this.percent = 1;
		this.fullColour = Phaser.Display.Color.HexStringToColor('0x00ff00');		
		this.emptyColour = Phaser.Display.Color.HexStringToColor('0xff0000');
	}

	create(data={ currentScene: Phaser.Scene, collectableTarget: int }) {
		const {width, height} = this.sys.game.canvas;
		this.currentScene = data.currentScene;
		
		const statusBarHeight = 0.12 * height;
		const healthBarWidth = 0.3; // The sum of these widths should be <=1
		const scoreTextWidth = 0.3;
		const weaponWidth = 0.2;
    const keysWidth = 0.2;

    const targetCountWidth = 0.2;

		var startPosition = 0; 
		// this.addBackgroundImage(width, height, statusBarHeight);

		// startPosition = this.addScoreText(startPosition, height, width * scoreTextWidth, statusBarHeight, width);
    startPosition = this.addKeys(startPosition, height, keysWidth, statusBarHeight, width);
    startPosition = this.addWeapons(startPosition, height, width * weaponWidth, statusBarHeight, width);		
    startPosition = this.addCollectableCount(startPosition, height, width * targetCountWidth, statusBarHeight, width, data.collectableTarget);
		startPosition = this.addHealthBar(startPosition, height, width * healthBarWidth, statusBarHeight, width);
    
    // startPosition, height, width * weaponWidth, statusBarHeight, width);		

		this.addTimer(width, height);
		this.addScoreTextOO(startPosition, width, width * scoreTextWidth, statusBarHeight, width);

		this.timer = this.time.addEvent({
			delay: 1000 * this.maxSeconds, // The timer uses milliseconds
		});
	}

	addBackgroundImage(width, height, statusBarHeight) {
    // let {widthoo, heightoo} = this.sys.game.canvas;
		// const backgroundLeft = this.add.image(0, height, 'ui-display', 2).setOrigin(0, 1); // Use bottom left corner as origin
    const backgroundMiddle = this.add.image(0, height, 'ui-display', 3).setOrigin(0, 1); // Use bottom left corner as origin
    // const backgroundRight = this.add.image(width-16, height, 'ui-display', 2).setOrigin(0, 1).setFlipX(true); // Use bottom left corner as origin

    // console.log(widthoo)
    // background
    
    backgroundMiddle.displayWidth = width;
		backgroundMiddle.displayHeight = statusBarHeight;
	}

  addKeys(startPosition, canvasHeight, displayWidth, statusBarHeight, statusBarWidth) {
    const yPadding = 0.5 * statusBarHeight; // The midpoint of the status bar
    const xPadding = 0.06 * statusBarWidth; // Stop this overlapping other things in the status bar
    const spacing = 0.06 * statusBarWidth;

    this.keys = []
    for (var i = 0; i < 3; i++) {    
      this.keys[i] = this.add.image(startPosition + xPadding + i*spacing, canvasHeight - yPadding, 'items', `key-shadow-${i}.png`).setOrigin(0.5, 0.5).setScale(0.75).setAlpha(0.35);
      this.keys[i].rotation = 0.5
    }

    return startPosition + 2*xPadding + 2*spacing
  }

  collectKey(keyType) { 
    gameState.inventory.keys.push(keyType);
    this.keys[keyType].setTexture('items', `key-${keyType}.png`);
    this.increaseScoreTween(200);   
  }

	addWeapon(startPosition, height, WeaponFullWidth, statusBarHeight, statusBarWidth) { 
		const yPadding = 0.5 * statusBarHeight; // The midpoint of the status bar
		const xPadding = 0.02 * statusBarWidth; // Stop this overlapping other things in the status bar

		this.weaponImage = this.add.image(startPosition + xPadding, height - yPadding);

		// Find the aspect ratio so the width can be corrected when the height is set using displayHeight. Can this be done in a nicer way?
		const aspectRatio = this.weaponImage.width/this.weaponImage.height;
		this.weaponImage.displayHeight = 0.9 * statusBarHeight;
		this.weaponImage.displayWidth = 0.9 * statusBarHeight * aspectRatio;

		this.ammoText = this.add.bitmapText(startPosition + xPadding + WeaponFullWidth/2, height - yPadding, 'meyrin', `0/0`, 24).setOrigin(0, 0);    
		
    // this.equipWeapon(gameState.inventory.equippedWeapon);
    this.equipWeapon(this.currentScene.scene.player.weapon);

		return startPosition + WeaponFullWidth
	}

  addWeapons(startPosition, height, WeaponFullWidth, statusBarHeight, statusBarWidth) { 
		const yPadding = 0.5 * statusBarHeight; // The midpoint of the status bar
		const xPadding = 0 //0.008 * statusBarWidth; // Stop this overlapping other things in the status bar

		this.secondaryWeaponImage = this.add.image(startPosition + xPadding + 1.1*WeaponFullWidth, height - yPadding);
		this.weaponImage = this.add.image(startPosition + xPadding, height - yPadding);

		// Find the aspect ratio so the width can be corrected when the height is set using displayHeight. Can this be done in a nicer way?
		const aspectRatio = this.weaponImage.width/this.weaponImage.height;
		this.weaponImage.displayHeight = 0.9 * statusBarHeight;
		this.weaponImage.displayWidth = 0.9 * statusBarHeight * aspectRatio;
    
    this.secondaryWeaponImage.displayHeight = 0.6 * statusBarHeight;
    this.secondaryWeaponImage.displayWidth = 0.6 * statusBarHeight * aspectRatio;

		this.ammoText = this.add.bitmapText(startPosition + xPadding + WeaponFullWidth/2, height - yPadding, 'meyrin', `0/0`, 24).setOrigin(0, 0);    
		
    // this.equipWeapon(gameState.inventory.equippedWeapon);
    this.equipWeapon(this.currentScene.scene.player.weapon);

		return startPosition + 1.4*WeaponFullWidth
	}

	equipWeapon(weapon) {  
		this.weaponImage.setTexture('weapons', `${gameState.inventory.equippedWeapon}.png`);
    this.weaponImage.setOrigin(0, 0.5);
		this.updateAmmo(weapon.ammoType);

    this.secondaryWeaponImage.setTexture('weapons', `${gameState.inventory.secondaryWeapon}.png`);
    this.secondaryWeaponImage.setOrigin(0.5, 0.5).setAlpha(0.4);
	}

	updateAmmo(ammoType) {
		// const weapon = gameState.inventory.weapon;
		this.updateAmmoText(gameState.inventory.ammo[ammoType]);
	}

	updateAmmoText(amount) {
		if (typeof(amount) == "number" && amount >= 0){//amount != null) {
			this.ammoText.text = `${amount}`;
		} else {
			this.ammoText.text = '-';	
		}
	}


  
	addScoreTextOO(startPosition, height, TextFullWidth, statusBarHeight, statusBarWidth) {

    // const background = this.add.image(0, 18, 'hud-background').setOrigin(0, 0.5);
		// background.displayWidth = height/8;

		const yPadding = 0.5 * statusBarHeight; // The midpoint of the status bar
		const xPadding = 0.02 * statusBarWidth; // Stop this overlapping other things in the status bar

    const targetImage = this.add.image(0 + xPadding, 0 + yPadding, 'items', 'star-0.png').setOrigin(0, 0.5);
		targetImage.displayHeight = 0.9 * statusBarHeight;
		targetImage.displayWidth = 0.9 * statusBarHeight;

    const text = Phaser.Utils.String.Pad(gameState.score, 6, '0', 1); 
		this.scoreText = this.add.bitmapText(0 + 2*xPadding + targetImage.displayWidth, 0 + yPadding, 'meyrin', text, 28).setOrigin(0, 0.5);
		// this.scoreText.maxWidth = TextFullWidth - 2*xPadding; // This breaks the text where there is whitespace, it will be wider than this if any of the words are!
		this.scoreSignText = this.add.bitmapText(0 + 2*xPadding + targetImage.displayWidth - 14, 0 + yPadding, 'meyrin', '', 28).setOrigin(0, 0.5);

		return startPosition + TextFullWidth
	}


	addHealthBar(startPosition, gameHeight, healthBarFullWidth, statusBarHeight, statusBarWidth) {
		const healthBarHeight = 0.5 * statusBarHeight; // Leave some space at the top and bottom of the status bar
		const yPadding = 0.5 * statusBarHeight; // The midpoint of the status bar
		const xPadding = 0.02 * statusBarWidth; // Stop the edge of the health bar touching the edge of the screen

		// Health bar shadow
		const leftShadowCap = this.add.image(startPosition + xPadding, gameHeight - yPadding, 'left-cap-shadow').setOrigin(0, 0.5);
		leftShadowCap.displayHeight = healthBarHeight;

		// Use the displayWidth of the end caps to work out the width of the middle section
		this.healthBarWidth = healthBarFullWidth - 2 * (leftShadowCap.displayWidth + xPadding) 
		
		const middleShaddowCap = this.add.image(leftShadowCap.x + leftShadowCap.width, gameHeight - yPadding, 'middle-shadow').setOrigin(0, 0.5);			
		middleShaddowCap.displayWidth = this.healthBarWidth;
		middleShaddowCap.displayHeight = healthBarHeight;
		const rightShadowCap = this.add.image(middleShaddowCap.x + middleShaddowCap.displayWidth, gameHeight - yPadding, 'left-cap-shadow').setOrigin(0, 0.5).setFlipX(true);
		rightShadowCap.displayHeight = healthBarHeight;

		// Health bar
		this.leftCap = this.add.image(startPosition + xPadding, gameHeight - yPadding, 'left-cap').setOrigin(0, 0.5);
		this.leftCap.displayHeight = healthBarHeight;
		this.middle = this.add.image(this.leftCap.x + this.leftCap.width, gameHeight - yPadding, 'middle').setOrigin(0, 0.5);
		this.middle.displayHeight = healthBarHeight;
		this.rightCap = this.add.image(this.middle.x + this.middle.displayWidth, gameHeight - yPadding, 'left-cap').setOrigin(0, 0.5).setFlipX(true);
		this.rightCap.displayHeight = healthBarHeight;

		this.setHealthBarTint(this.fullColour.color);
		this.setHealthBarPercent(gameState.health);

		return startPosition + healthBarFullWidth
	}

	setHealthBarTint(tintColour) {
		this.leftCap.setTint(tintColour);
		this.middle.setTint(tintColour);
		this.rightCap.setTint(tintColour);
	}

	setHealthBarPercent(health, duration=500) {
		const oldPercent = this.percent;
		this.percent = this.getPercent(health);

		this.tweens.addCounter({
      from: oldPercent,
      to: this.percent,
      duration,
			ease: Phaser.Math.Easing.Sine.Out,
      onUpdate: function (tween) {
				this.setHealthBarTint(this.getTint(tween.getValue()))
				this.middle.displayWidth = Math.floor(this.healthBarWidth * tween.getValue());

				this.rightCap.x = this.middle.x + this.middle.displayWidth;

				this.leftCap.visible = this.middle.displayWidth > 0;
				this.middle.visible = this.middle.displayWidth > 0;
				this.rightCap.visible = this.middle.displayWidth > 0;
        }.bind(this)
    });
	}

	addScoreText(startPosition, height, TextFullWidth, statusBarHeight, statusBarWidth) {

    // const yPadding = 0.5 * statusBarHeight; // The midpoint of the status bar
		// const xPadding = 0.02 * statusBarWidth; // Stop this overlapping other things in the status bar

    // const targetImage = this.add.image(startPosition + xPadding, height - yPadding, 'slasher-items', 84).setOrigin(0, 0.5);
		// targetImage.displayHeight = 0.9 * statusBarHeight;
		// targetImage.displayWidth = 0.9 * statusBarHeight;

    // this.targetText = this.add.bitmapText(startPosition + 2*xPadding + targetImage.displayWidth, height - yPadding, 'meyrin', `${gameState.itemsCollected}/${collectableTarget}`, 28).setOrigin(0, 0.5);
		// this.targetText.maxWidth = targetCountWidth - targetImage.displayWidth - 2*xPadding; 
	
		// return startPosition + 4*xPadding + targetImage.displayWidth + this.targetText.width;


		const yPadding = 0.5 * statusBarHeight; // The midpoint of the status bar
		const xPadding = 0.02 * statusBarWidth; // Stop this overlapping other things in the status bar

    const targetImage = this.add.image(startPosition + xPadding, height - yPadding, 'items', 'star-0.png').setOrigin(0, 0.5);
		targetImage.displayHeight = 0.9 * statusBarHeight;
		targetImage.displayWidth = 0.9 * statusBarHeight;

    const text = Phaser.Utils.String.Pad(gameState.score, 6, '0', 1); 
		this.scoreText = this.add.bitmapText(startPosition + 2*xPadding + targetImage.displayWidth, height - yPadding, 'meyrin', text, 28).setOrigin(0, 0.5);
		// this.scoreText.maxWidth = TextFullWidth - 2*xPadding; // This breaks the text where there is whitespace, it will be wider than this if any of the words are!
		this.scoreSignText = this.add.bitmapText(startPosition + 2*xPadding + targetImage.displayWidth, height - yPadding, 'meyrin', ' dfefefefef-', 28).setOrigin(0, 0.5);

		return startPosition + TextFullWidth
	}

	addTimer(width, height) {
		// Background image
		// const background = this.add.image(7*width/8, 18, 'hud-background').setOrigin(0, 0.5);
		// background.displayWidth = width/8;
		
		this.timerText = this.add.bitmapText(7*width/8 + 6, 9, 'meyrin', this.timeToText(0), 28).setDepth(1000);
	}

  pauseTimer() {
    this.timer.paused = true;
  }

	timeToText(time) {		
		const minutes = Phaser.Utils.String.Pad(Math.floor(time / 60), 2, '0', 1); // The last argument is the side the padding is added,: 1 for left, 2 for right
		const seconds = Phaser.Utils.String.Pad(Math.floor(time % 60), 2, '0', 1);
		return `${minutes}:${seconds}`;
	}

	increaseScoreTween(value) {
		// Increase the score by incrementing one point at a time in the display
		this.tweens.addCounter({
      from: gameState.score,
      to: gameState.score += value,
      duration: Math.abs(value),
			ease: Phaser.Math.Easing.Sine.Out,
      onUpdate: function (tween) {
				this.scoreText.text = this.scoreToString(tween.getValue());
      }.bind(this)
    });
	}

  scoreToString(score) {
    this.scoreSignText.text = score < 0 ? '-' : '';
    return Phaser.Utils.String.Pad(Math.floor(Math.abs(score)), 6, '0', 1);
  }

	resetState() {
		gameState.score = 0;
    gameState.itemsCollected = 0;
	}
	
	getPercent(health) {
		return health / gameState.maxHealth;
	}

	getTint(percent) {
		const r = this.emptyColour.red * (1 - percent) + this.fullColour.red * percent;
		const g = this.emptyColour.green * (1 - percent) + this.fullColour.green * percent;
		const b = this.emptyColour.blue * (1 - percent) + this.fullColour.blue * percent;
		return Phaser.Display.Color.GetColor(r, g, b);
	}

  addCollectableCount(startPosition, height, targetCountWidth, statusBarHeight, statusBarWidth, collectableTarget) {
		const yPadding = 0.5 * statusBarHeight; // The midpoint of the status bar
		const xPadding = 0.02 * statusBarWidth; // Stop this overlapping other things in the status bar

    const targetImage = this.add.image(startPosition + xPadding, height - yPadding, 'items', 'body-part-0.png').setOrigin(0, 0.5);
		targetImage.displayHeight = 0.9 * statusBarHeight;
		targetImage.displayWidth = 0.9 * statusBarHeight;

    this.targetText = this.add.bitmapText(startPosition + 2*xPadding + targetImage.displayWidth, height - yPadding, 'meyrin', `${gameState.itemsCollected}/${collectableTarget}`, 28).setOrigin(0, 0.5);
		this.targetText.maxWidth = targetCountWidth - targetImage.displayWidth - 2*xPadding; 
	
		return startPosition + 2*xPadding + targetImage.displayWidth + this.targetText.width;
  }

  collectItem(collectableTarget, collectableScore) {
    gameState.itemsCollected += 1;
    this.targetText.text = `${gameState.itemsCollected}/${collectableTarget}`;
    this.increaseScoreTween(collectableScore);   
    
    // Activate exit when score high enough
    if (gameState.itemsCollected == collectableTarget) {
      this.currentScene.scene.activateExit();
    } 
  }

	launchSummaryScreen() {
    this.pauseTimer();
		// this.timer.paused = true;
		this.currentScene.start('SummaryScreen', {score: this.computeFinalScore()});
		gameState.score = 0;
    gameState.itemsCollected = 0;
		this.scene.stop(); 
	}

	computeFinalScore() {
		// Add time bonuses etc to the score
		const timeBonus = 1000;
		const timeLeftPercent = 1 - this.timer.getElapsed() / (1000 * this.maxSeconds);
		let ammoBonus = 0;
    for (var ammoType of Object.keys(gameState.inventory.ammo)) {
      ammoBonus += 2 * gameState.inventory.ammo[ammoType];// + 4 * gameState.inventory.ammo.shotgun;
    }
		const healthBonus = 10 * gameState.health; // Is this value updated?
		
		return gameState.score + Math.floor(timeLeftPercent * timeBonus) + ammoBonus + healthBonus;
	}

	update() {
		const timeLeft = this.maxSeconds - Math.floor(this.timer.getElapsed() / 1000)
		this.timerText.text = this.timeToText(timeLeft);

		if(timeLeft <= 0) {
			this.scene.launch('Menu', {menuType: 'fail', menuTitle: 'Out of time', currentScene: this.currentScene});
      this.scene.get('UIOverlay').resetState();
			this.scene.pause();
		}
	}
}
