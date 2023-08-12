class StartMenu extends Phaser.Scene {
	constructor() {
		super({key: 'StartMenu'})		
	}

  preload () {
		this.load.bitmapFont('meyrin', 'assets/fonts/meyrin/meyrin.png', 'assets/fonts/meyrin/meyrin.xml');
  }

  create() {
    this.scene.launch('Menu', { menuType: 'main', menuTitle: '', currentScene: this.scene });
  }
}
