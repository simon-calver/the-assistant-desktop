class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, spriteName, enemyStats) {  
    super(scene);

    this.spriteName = spriteName;

    scene.add.existing(this); 
    scene.physics.add.existing(this);

    this.maxSpeed = enemyStats.maxSpeed || 80;
    this.minSpeed = enemyStats.minSpeed || 40;
    this.speed = this.minSpeed;
    this.idle = true;
    this.idleTime = Phaser.Math.RND.between(180, 220); // This is the amount of time it waits before moving, randomise it so they don't all move in unison
    
    this.timeUntilIdle = Phaser.Math.RND.between(180, 220); 
    this.lightTimer = 0;

    this.health = enemyStats.health || 3;
    this.attackDamage = enemyStats.damage || 1;
    this.path = [];
    this.isAttacking = false;
    this.attackRange = enemyStats.attackRange || 40; // I think this is in pixels
    this.value = enemyStats.value || 100; // The score for killing this enemy

    this.timePathFound = 0; // Stops the path updating every frame
    this.timeLastTargetReached;
    this.targetAngle = 0;

    // Add callback function to each of the attack animations so damage is done only after the animation has played. Is 
    // setting up the callback in this class the best place to do it?
    const attackAnims = [`${this.spriteName}_attack_left`, `${this.spriteName}_attack_right`, `${this.spriteName}_attack_up`, `${this.spriteName}_attack_down`];
    for (var animKey of attackAnims) {
      this.on(`animationcomplete-${animKey}`, function (animation, frame) {
      this.damageTarget();
      });
    }
  }
	
	spawn(x, y, useLighting=false) {
		this.setPosition(x, y).setDamping(true).setDrag(0.01).setOrigin(0.5, 1);//.setActive(true).setVisible(true).setMass(1000);//.setMass().setImmovable(true);//.setDamping(true).setDrag(0.02).setImmovable(true);
		if (useLighting) {
			this.setPipeline('Light2D');
		}


    // this.graphics = this.scene.add.graphics({ lineStyle: { width: 2, color: 0x00ff00 }, fillStyle: { color: 0xff0000 }});
    // this.point = new Phaser.Geom.Rectangle(this.x, this.y, 4, 4);
    // this.graphics.fillRect(this.x - 2, this.y - 2, this.point.width, this.point.height).setDepth(100);

	}

	update(time, delta){	
    // this.graphics.fillRect(this.x - 2, this.y - 2, this.point.width, this.point.height).setDepth(100);

    if (this.isAttacking) {

    } else if (this.hasTarget()) {
      this.moveToTarget(time);
      // The target may be unreachable if it hasn't got there after a reasonable amount of time.
      // The units are milliseconds
      if (time - this.timeLastTargetReached > 5000) {
        this.resetPath();
        this.timeLastTargetReached = time; // This time needs to be update otherwise this if block will keep getting called after it fails to reach a target
      }
    } else if (this.idleTime < 0) {
      this.speed = this.minSpeed;
      this.idleTime = Phaser.Math.RND.between(180, 220); 
      this.path.push(this.randomDirection().add(this.getCenter()));
    } else {
      this.idleTime--;
    }

    // if (this.timeUntilIdle < 0) {
    //   this.speed = this.minSpeed;
    //   this.timeUntilIdle = Phaser.Math.RND.between(180, 220);
		// // 		const direction = this.randomDirection().add(this.getCenter());
		// // 		this.path.push(direction);
    // }
    this.lightTimer--;
    // Does this need to be updated every frame? Just update when something changes
    this.playAnimation();

    // if (this.isAttacking) {

    // } else 
    
    
    // if (this.isFleeing) {
    //   // console.log(this.timeScared)
    //   if (this.timeScared < 0) {
    //     this.isFleeing = false;
    //   }
    //   // Check distance from thing prob not neccessary, use timer
    //   this.timeScared--;
    // }




		// if (this.isAttacking) {
    //   // this.playAnimation() ;
		// } 
    // // else if (this.isFleeing) { 
    // //   this.playAnimation();
    // //   this.moveToTarget(time);
    // // }
    //  else {
		// 	// this.playAnimation();

		// 	if (this.hasTarget()) {
		// 		this.moveToTarget(time);

		// 		// The target may be unreachable if it hasn't got there after a reasonable amount of time.
		// 		// The units are milliseconds
		// 		if (time - this.timeLastTargetReached > 5000) {
		// 			this.resetPath();
    //       this.timeLastTargetReached = time; // This time needs to be update otherwise this if block will keep getting called after it fails to reach a target
    //     }
		// 	} else if (this.idleTime < 0) {
    //     // change direction on collision
		// 		this.speed = this.minSpeed;
		// 		this.idleTime = Phaser.Math.RND.between(180, 220);
		// 		const direction = this.randomDirection().add(this.getCenter());
		// 		this.path.push(direction);
		// 	} else {
		// 		this.idleTime--;
		// 	}
		// }

    // this.timeUntilIdle = 0;
    // This puts the enemy in front of or behind the player, seems a bit excessive to update the depth every frame
    if (this.y > this.scene.player.y) {
      this.setDepth(8);
    } else {
      this.setDepth(6);
    } 
	}

  playAnimation() {
    if (this.isAttacking) {
      if (this.targetAngle > Math.PI/4 & this.targetAngle <= 3*Math.PI/4) {
				this.anims.play(`${this.spriteName}_attack_down`, true);
			} else if (this.targetAngle > -Math.PI/4 & this.targetAngle <= Math.PI/4) {
				this.anims.play(`${this.spriteName}_attack_right`, true);				
			} else if (this.targetAngle > -3*Math.PI/4 & this.targetAngle <= -Math.PI/4) {				
				this.anims.play(`${this.spriteName}_attack_up`, true);
			} else {				
				this.anims.play(`${this.spriteName}_attack_left`, true);
			}	
    } else if (this.body.speed > 10) {
      if (this.targetAngle > Math.PI/4 & this.targetAngle <= 3*Math.PI/4) {
        this.anims.play(`${this.spriteName}_move_down`, true);
      } else if (this.targetAngle > -Math.PI/4 & this.targetAngle <= Math.PI/4) {
        this.anims.play(`${this.spriteName}_move_right`, true);				
      } else if (this.targetAngle > -3*Math.PI/4 & this.targetAngle <= -Math.PI/4) {				
        this.anims.play(`${this.spriteName}_move_up`, true);
      } else {				
        this.anims.play(`${this.spriteName}_move_left`, true);
      }	
    } else {
      if (this.targetAngle > Math.PI/4 & this.targetAngle <= 3*Math.PI/4) {
        this.anims.play(`${this.spriteName}_idle_down`, true);
      } else if (this.targetAngle > -Math.PI/4 & this.targetAngle <= Math.PI/4) {
        this.anims.play(`${this.spriteName}_idle_right`, true);				
      } else if (this.targetAngle > -3*Math.PI/4 & this.targetAngle <= -Math.PI/4) {				
        this.anims.play(`${this.spriteName}_idle_up`, true);
      } else {				
        this.anims.play(`${this.spriteName}_idle_left`, true);
      }	
    }
  }

  hasTarget() {
		return this.path.length > 0;
	}

	moveToTarget(currentTime) {
		this.targetAngle = this.angleToTarget(this.path[0]);

		// move in this direction 
		this.setVelocityX(this.speed * Math.cos(this.targetAngle)); // In pixels per second
		this.setVelocityY(this.speed * Math.sin(this.targetAngle));	

		// Remove this path element once we are sufficiently close to it (1 is a bit arbitrary but works well enough for now)
		if (Phaser.Math.Distance.BetweenPoints(this.getCenter(), this.path[0]) < 10) {
			this.path.shift();
			this.timeLastTargetReached = currentTime;
      
      this.isFleeing = false;  // where to put this??
		}
	}
  
  angleToTarget(target) {
		return Phaser.Math.Angle.BetweenPoints(this.getCenter(), target);
	}
  
	resetPath() {
		this.path = [];
	}

  randomDirection(vectorLength=40) {
		let direction = new Phaser.Math.Vector2();
		direction.setToPolar(Phaser.Math.FloatBetween(0, Phaser.Math.PI2), vectorLength);
		return direction;
	}

	attack(target) {	
		// Don't do anything if already in the middle of attacking or runing away
		if (!this.isAttacking && !this.isFleeing) {
			// Set isAttacking to true, this stops other updates i.e. moving
			this.isAttacking = true;

			// Reset the path so it doesn't carry on moving after the attack
			this.resetPath();

			// Find the direction of the target and use this to determine the animation
			this.target = target;
			this.targetAngle = this.angleToTarget(target);//.getCenter());
			
			// The rest of the attack logic is handled by callback functions for each animation (set up in
			// the constructor)
      // if (this.targetAngle > Math.PI/4 & this.targetAngle <= 3*Math.PI/4) {
			// 	this.anims.play(`${this.spriteName}_attack_down`, true);
			// } else if (this.targetAngle > -Math.PI/4 & this.targetAngle <= Math.PI/4) {
			// 	this.anims.play(`${this.spriteName}_attack_right`, true);				
			// } else if (this.targetAngle > -3*Math.PI/4 & this.targetAngle <= -Math.PI/4) {				
			// 	this.anims.play(`${this.spriteName}_attack_up`, true);
			// } else {				
			// 	this.anims.play(`${this.spriteName}_attack_left`, true);
			// }	
		}
	}

	damageTarget() {
		if (Phaser.Math.Distance.BetweenPoints(this.getCenter(), this.target) < this.attackRange) { //.getCenter()
			this.target.reduceHealth(this.attackDamage);   
		}
		this.isAttacking = false;
	}

	getPath(target) {
    if (!this.isFleeing) {
      this.resetPath();
      
      // Locations in world coordinates need to be converted to the tilemap index
      const currentLocation = this.worldPosToTile(this.x, this.y);
      const targetLocation = this.worldPosToTile(target.x, target.y);
          
      this.pathId = this.scene.finder.findPath(currentLocation.x, currentLocation.y, targetLocation.x, targetLocation.y, function(path) {
        if (path === null) {
          console.warn(`Path was not found for ${this.spriteName}.`);
        } else {
          // The first path element is ignored since this is where you should be, a better transformation
          // to world coordinates might mean you don't need to do this. Similarly the last path element 
          // is taken to be the actual target
          for (var i = 1; i < path.length - 1; i++) {
            this.path.push(this.tileToWorldPos(path[i]));
          }
          this.path.push(target);
          this.timePathFound = game.getTime();
        }
      }.bind(this));
      
      this.scene.finder.calculate();
    }
	}
	
	tileToWorldPos(tile) {
		// Use the middle of the tile as the world position
		const world_x = tileSize*(tile.x + 1/2);
		const world_y = tileSize*(tile.y + 1/2);
		return new Phaser.Math.Vector2(world_x, world_y);
	}
	
	worldPosToTile(worldX, worldY) {
		const tile_x = Math.floor(worldX / tileSize);
		const tile_y = Math.floor(worldY / tileSize);
		return new Phaser.Math.Vector2(tile_x, tile_y);
	}

	flee(fromTarget) {
    this.isFleeing = true;
    this.timeScared = 10000;// this.scene.time.now;
    this.speed = this.maxSpeed;

    // console.log(fromTarget);
    // console.log(this.getCenter())
    this.resetPath();

    // Need this?
    // this.scene.finder.cancelPath(this.pathId);

    // Move away from target
    const angle = this.angleToTarget(fromTarget) + Phaser.Math.PI2/2;
    // console.log(angle)
    // console.log(Phaser.Math.PI1)
    // Choose random point > X distance from target, check it is not inacseible and set as target
    // let direction = this.randomDirection(10)
    
    // console.log(fromObject);
    // const target = fromTarget.subtract(this.getCenter());//.scale(10);
    let target = new Phaser.Math.Vector2();
		target.setToPolar(angle, 250);
    // console.log(target)
    // // console.log(direction)
    // // console.log(fromObject);
    // // console.log(target)

    // console.log(target);
    this.path.push(target.add(this.getCenter()));
  }

  changeDirection() {
    let distanceToMove;
    if (this.isFleeing) {
      distanceToMove = 250;
    } else {
      distanceToMove = 20;
    }
    // If the path length is greater than 1 it is probably using pathfinding so should avoid obstacles
    if (this.path.length <= 1) {
      this.resetPath(); 
      this.path.push(this.randomDirection(distanceToMove).add(this.getCenter()));
    }
  }

	receiveDamage(amount) {
		this.health = this.health - amount;
    
    this.scene.audio['bullet-body-hit'].play();

		if (this.health <= 0) {
			this.die();
		}
	}

  die() {
		this.scene.scene.get('UIOverlay').increaseScoreTween(this.value); // Update the score
		this.bloodSplatter();
		this.destroy();
	}

  bloodSplatter() {
		var blood = this.scene.physics.add.image(this.x, this.y, 'items', `blood-splatter-${Phaser.Math.RND.integerInRange(0, 2)}.png`).setDepth(1).setScale(0.5).setPipeline('Light2D');
		var radius = 100;

    
		// The default orgin for setCircle is the top left corner!!
		blood.body.setCircle(
			radius,
			(blood.width / 2 - radius), // x offset
			(blood.height / 2 - radius) // y offset
		);

    // Use createCircleBody(blood.body, radius),  needs to be made more generic
		this.scene.blood.add(blood);
	}

	reactToSound(soundSource) {    
	}

  reactToLight(lightSource) {
  }

	reactToBlood(blood) {
	}
}

class Rat extends Enemy {
	constructor(scene) {  
		const enemyStats = {
			minSpeed: 80,
			maxSpeed: 140,
      attackDamage: 0.2,
      value: -20
		}
		super(scene, 'rat', enemyStats).setScale(0.75);

    this.body.setSize(10, 10, true); // Set size smaller than sprite so it overlaps things behind it. Can this be done another way?
  }

  attack() {
  }
}

class Mantis extends Enemy {
	constructor(scene) {  
		const enemyStats = {
			minSpeed: 40,
			maxSpeed: 140,
      attackDamage: 2,
      health: 2
		}
		super(scene, 'mantis', enemyStats);

    this.body.setSize(10, 14, true); // Set size smaller than sprite so it overlaps things behind it. Can this be done another way?
    this.body.setOffset(12, 18);
  }

	reactToSound(soundSource) {
    if (game.getTime() - this.timePathFound > 500) {
		  this.speed = this.maxSpeed;
		  this.getPath(soundSource);
    }
	}
}

class BloodBug extends Enemy {
	constructor(scene) {  
		const enemyStats = {
			minSpeed: 60,
			maxSpeed: 110,
			health: 1
		}
		super(scene, 'bug', enemyStats);

    this.body.setSize(14, 14, true); // Set size smaller than sprite so it overlaps things behind it. Can this be done another way?
    // this.body.setOffset(12, 18);
  }

  reactToLight(target) {
    if (this.lightTimer < 0) {
      this.getPath(target);
      this.lightTimer = 400;
    }
  }

  reactToSound(soundSource, volume) {
    if (volume > 100) {
      this.flee(soundSource);
    }
	}
}

class CreepWorm extends Enemy {
	constructor(scene) {  
		const enemyStats = {
			minSpeed: 20,
			maxSpeed: 65
		}
		super(scene, 'worm', enemyStats);
  }

	reactToBlood(blood) {
		blood.body.setEnable(false);
		this.getPath(blood.getCenter());
		this.idleTime = 500;
	}
}
