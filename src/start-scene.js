class StartScene extends TopDownShooter {
    
  constructor() {
		super({ key: 'StartScene', map: 'the-abduction' });
        this.collectableTarget = 3;
        this.collectableScore = 1000;
	}

	init() { 
		this.resetState();
	}

	resetState() {
    gameState.score = initialGameState().score;
    gameState.itemsCollected = initialGameState().itemsCollected;
    gameState.health = initialGameState().health;
    gameState.inventory = initialGameState().inventory;
	}
}
