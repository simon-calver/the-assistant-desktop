class Menu extends Phaser.Scene {
	constructor() {
		super({key: 'Menu'})		
	}

  preload() {
  this.load.image('hud-background', 'assets/sprites/display/hud-background.png')
  }

  create(data={menuType: string, menuTitle: string, currentScene: Phaser.Scene}) {
    this.textHeight = 50; 
    switch(data.menuType) {
      case 'main':
        this.createMenu(['begin', 'signin'], data.menuTitle);
        break;
      case 'pause':
        this.createMenu(['resume', 'exit'], data.menuTitle);
        break;
      case 'fail':
        this.createMenu(['retry', 'exit'], data.menuTitle);
        break;
    }
    this.currentScene = data.currentScene;
    this.pauseScenes();
    
    this.unpause = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // For entering cheats!
    this.uKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.U);
    this.iKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    this.oKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O);
    this.pKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);

    this.codeInput = '';
  }

  update() {        
    if (Phaser.Input.Keyboard.JustDown(this.unpause)) {
      this.resumeScenes();
      this.scene.stop();
    }

    if (Phaser.Input.Keyboard.JustDown(this.uKey)) {
      this.codeInput += 'u';
    }
    if (Phaser.Input.Keyboard.JustDown(this.iKey)) {
      this.codeInput += 'i';
    }
    if (Phaser.Input.Keyboard.JustDown(this.oKey)) {
      this.codeInput += 'o';
    }
    if (Phaser.Input.Keyboard.JustDown(this.pKey)) {
      this.codeInput += 'p';
    }
    
    if (this.codeInput == 'poo') {
      new WeaponItem(this.currentScene.scene, this.currentScene.scene.player.x, this.currentScene.scene.player.y - 16, 'sawn-off', 100);
      this.codeInput = '';
    }
    if (this.codeInput == 'oop') {
      new WeaponItem(this.currentScene.scene, this.currentScene.scene.player.x, this.currentScene.scene.player.y - 16, 'sniper-0', 100);
      this.codeInput = '';
    }
    if (this.codeInput == 'pi') {
      new CollectableItem(this.currentScene.scene, this.currentScene.scene.player.x, this.currentScene.scene.player.y - 16, 'items', 'body-part-0.png');
      this.codeInput = '';
    }
    if (this.codeInput == 'opi') {
      new KeyItem(this.currentScene.scene, this.currentScene.scene.player.x, this.currentScene.scene.player.y - 16, 0);
      this.codeInput = '';
    }
    if (this.codeInput == 'pop') {
      new KeyItem(this.currentScene.scene, this.currentScene.scene.player.x, this.currentScene.scene.player.y - 16, 1);
      this.codeInput = '';
    }
  }

  pauseScenes() {
    // this.currentScene.pause('UIOverlay');
    this.currentScene.get('UIOverlay').pauseTimer();
    this.currentScene.pause();
  }

  resumeScenes() {
    this.currentScene.resume('UIOverlay');
    this.currentScene.resume();
  }

  createMenu(options, title) {
    let {width, height} = this.sys.game.canvas;
    const x = width/2;
    const y = height/4;
    const background = this.add.image(x, y - this.textHeight, 'hud-background').setOrigin(0.5, 0);

    background.displayWidth = width/4;
    background.displayHeight = options.length * this.textHeight + 40;
  
    // Add text for title 
    this.add.bitmapText(x, y - this.textHeight, 'meyrin', title, 36).setOrigin(0.5, 0).setDropShadow(4, 4, 0x000000);

    for(var i = 0; i < options.length; i++) { 
      const interactiveText = this.add.bitmapText(x, y + i*this.textHeight, 'meyrin', getText(options[i]), 28).setOrigin(0.5, 0).setInteractive();
      switch(options[i]) {
        case 'begin':
          var interactiveTextFunction = function() {                        
            this.currentScene.start('StartScene', {fadeIn: true});
            this.scene.stop();
          }.bind(this);
          break;
        case 'signin':
          var interactiveTextFunction = function() {                        
            this.currentScene.start('StartScene', {fadeIn: true});
            this.scene.stop();
          }.bind(this);
          break;
        case 'resume':
          var interactiveTextFunction = function() {                        
            this.resumeScenes();
            this.scene.stop();
          }.bind(this);
          break;
        case 'retry':
          var interactiveTextFunction = function() {
            this.currentScene.start('StartScene', {fadeIn: true});
            this.scene.stop();
          }.bind(this);
          break;
        // case 'exit':
        //     var interactiveTextFunction = function() {
        //         this.scene.start('StartMenu');
        //         // this.scene.stop();
        //         // this.currentScene.scene.stop();
        //     }.bind(this);
        //     break;
      }
      interactiveText.on('pointerdown', function(pointer) { 
          interactiveTextFunction();
      }.bind(this));
      // itemText.on('pointerover', function(pointer) {
      // }
      // itemText.on('pointerout', function(pointer) { 
      // }
    }
  }
}

var menuText = {
  'resume': 'Resume',
  'retry': 'Retry',
  'exit': 'Exit',
  'begin': 'Begin',
  'signin': 'Sign in'
}

function getText(key) {
  return menuText[key];
}
