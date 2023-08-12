class TiledScene extends Phaser.Scene {
	constructor(data) {
    const assetsPath = data.assetsPath;
    const mapName = data.mapName;
    super({
      key: data.key,
      pack: {
        files: [
          { type: 'json', key: 'tiledMapJson', url: `${assetsPath}/tilemaps/${mapName}.json`},
          { 'type': 'bitmapFont', 'key': 'meyrin', 'textureURL': 'assets/fonts/meyrin/meyrin.png', 'fontDataURL': 'assets/fonts/meyrin/meyrin.xml' }
        ] 
      }
    });

    this.assetsPath = assetsPath;
    this.mapName = mapName;
    this.useLighting = (typeof(useLighting) !== 'undefined') ?  useLighting : false;

    this.loadComplete = false;
	}

  preload () {
    let width = this.cameras.main.width;
    let height = this.cameras.main.height;

    let progressBar = this.add.graphics();
    let progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width/4, height/2 - 30, width/2, 50);

    let loadingText = this.add.bitmapText(
      width / 2, 
      height / 2 - 50,
      'meyrin', 
      'Loading...',
      30
    ).setOrigin(0.5);

    let percentText = this.add.bitmapText(
      width / 2,
      height / 2 - 5,
      'meyrin',
      '0%',
      22
    ).setOrigin(0.5);

    let assetText = this.add.bitmapText(
      width / 2,
      height / 2 + 50,
      'meyrin',
      '',
      22
    ).setOrigin(0.5);
 
    this.load.on('progress', function (value) {
      if (!this.loadComplete) {
        percentText.setText(`${parseInt(value * 100)}%`);
        progressBar.clear();
        progressBar.fillStyle(0xffffff, 1);
        progressBar.fillRect(width/4 + 5, height/2 - 20, (width/2 - 10) * value, 30);
      }
    }, this);
                
    this.load.on('fileprogress', function (file) {
      if (!this.loadComplete) {
        assetText.setText(`Loading asset: ${file.src}`);
      }
    }, this);
    
    this.load.on('complete', function () {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
      assetText.destroy();
      this.loadComplete = true;
    }, this);

    this.loadMap();
    this.mainPreLoad();
  }

  loadMap() {
    const tiledMapJson = this.cache.json.get('tiledMapJson');
    for (var tileset of tiledMapJson.tilesets) {      
		  this.load.image(tileset.image, `${this.assetsPath}/tilemaps/${tileset.image}`);
    }

    tileSize = tiledMapJson.tileheight;

    // This file has already been loaded as a JSON in the constructor. Does it need to be loaded twice?
    this.load.tilemapTiledJSON(`${this.mapName}-map`, `${this.assetsPath}/tilemaps/${this.mapName}.json`);
  }

  mainPreLoad() {

  }

  create(data={fadeIn: boolean}) {
    if(data.fadeIn) {
			this.cameras.main.fadeIn(1000, 0, 0, 0);
		}

    const mapData = this.buildMap(); 

    if (this.useLighting) {
      this.lights.enable();
      this.lights.setAmbientColor(0x050505);
    }

    this.mainCreate(mapData);
  }

  mainCreate(mapData) {
    
  }

  buildMap() {
    // Create the tilemap from the json file made in Tiled
    const map = this.make.tilemap({ key: `${this.mapName}-map` });
    const metaData = map.objects.find(obj => obj.name == 'meta');

    // Get list of all tilesets used
    let tiles = [];
    for (var tileset of map.tilesets) {  
      tiles.push(map.addTilesetImage(tileset.name, `${tileset.name}.png`)); // The first argument is the tileset name in Tiled and the second the name it has in Phaser   
    }

    for (var layer of map.layers) { 
      if (layer.name == 'collision') {
        const collisionTiles = map.addTilesetImage('squares', 'squares.png');

        this.collisionLayer = map.createLayer('collision', collisionTiles, 0, 0);
        this.collisionLayer.visible = false;
        this.collisionLayer.setCollisionByExclusion([-1]);
      } else {
        const depth = layer.properties.find(obj => obj.name == 'Depth').value;

        // All Tiles are added to each layer, is that bad? It makes looping a lot easier!
        const mapLayer = map.createLayer(layer.name, tiles, 0, 0).setDepth(depth);
        if (this.useLighting) {
          mapLayer.setPipeline('Light2D');
        }
      }
    }

    this.setUpPathFinding(map);   

    return metaData;
  }

  setUpPathFinding(map) {
    this.finder = new EasyStar.js();

    // Easystar needs an array, so the data has to be extracted from the map
    var grid = [];
    for (var y = 0; y < map.height; y++) {
      var col = [];
      for (var x = 0; x < map.width; x++) {
        // In each cell we store the ID of the tile, which corresponds
        // to its index in the tileset of the map ("ID" field in Tiled)
        var tile = map.getTileAt(x, y, 'collision');
        col.push(tile.index);
      }
      grid.push(col);
    } 

    this.finder.setGrid(grid); 

    // Use the properties of the collision layer tiles in Tiled to set up pathfinding
    const tileset = map.tilesets.find(obj => obj.name == 'squares');
    const properties = tileset.tileProperties;
    
    const acceptableTiles = [-1]; // -1 corresponds to no tile in the collision layer

    for (var i = tileset.firstgid - 1; i < tileset.total; i++){ // firstgid and total are fields from Tiled that indicate the range of IDs that the tiles can take in that tileset
      if (!properties[i].collide) acceptableTiles.push(i + 1);
      if (properties[i].cost) this.finder.setTileCost(i + 1, properties[i].cost); // If there is a cost attached to the tile, let's register it            
    }

    this.finder.setAcceptableTiles(acceptableTiles); 
    this.finder.enableDiagonals();
    this.finder.disableCornerCutting();
  }

  worldPosToTile(worldX, worldY) {
		const tileX = Math.floor(worldX / tileSize);
		const tileY = Math.floor(worldY / tileSize);
		return new Phaser.Math.Vector2(tileX, tileY);
	}
}
