
const config = {
	type: Phaser.AUTO,
	width: 640, 
	height: 360, 
	backgroundColor: "000016",
	pixelArt: true,
	parent: 'parent',
	dom: {
    createContainer: true
  },
	callbacks: {
		postBoot: function (game) {
		  game.domContainer.style.pointerEvents = 'none';
		},
	}, 
	physics: {
    default: 'arcade',
    arcade: {
      enableBody: true,
      debug: false,
      overlapBias: 8
    }
  },
	scene: [ 
		StartScene,  
    UIOverlay,
		Menu,
		SummaryScreen
	]
}

const game = new Phaser.Game(config)

// This is accessible in all scenes 
const gameState = initialGameState();

const displayTextSize = 14;
var tileSize;
const useLighting = true;

function centerBodyOnBody(a, b, xOffset=0) {
	a.position.set(
	  b.x + b.halfWidth - a.halfWidth + xOffset,
	  b.y + b.halfHeight - a.halfHeight
	);
}
 
function getRelativePositionToCanvas(gameObject, camera) {
  return {
    x: (gameObject.x - camera.worldView.x) * camera.zoom,
    y: (gameObject.y - camera.worldView.y) * camera.zoom
  }
}

function getCurrentTime(){
  var currentdate = new Date(); 
  var time = currentdate.getHours() + ":"  + currentdate.getMinutes() + ":" + currentdate.getSeconds();
  return time;
}

function initialGameState() {
  return {
    score: 0,
    itemsCollected: 0,
    health: 20,
    maxHealth: 20,
    inventory: {
      'equippedWeapon': 'cricket',
      'secondaryWeapon': 'chester',
      'ammo': {
        'pistol': 40, 
        'shotgun': 40,
        'rifle': 40,
      },
      'keys': []
    }
  }
}
