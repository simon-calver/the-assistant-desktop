class SoundCollider extends Phaser.Physics.Arcade.Image { // This is just being used as a collider, does it need to extend image?
  constructor(scene, alwaysOn=false, showSoundWave=true) {  
    super(scene);
    scene.physics.add.existing(this); // Without this line "this" will be null
    this.body.setCircle(5);//.setEnable(false); // setEnable does nothing here!
    
    this.alwaysOn = alwaysOn;
    this.showSoundWave = true;//showSoundWave;

    this.target = null;
    this.audio = {};
   
    this.volume = 0;

    this.setDebugBodyColor(0xffff00); // This only has effect when config.physics.arcade.debug = true
  }

  setEnable(value) {
    if (!this.alwaysOn) {
      this.body.setEnable(value);
    }
  }

  addAudio(key, soundRadius, duration) {
    this.audio[key] = {
      'soundRadius': soundRadius,
      'duration': duration
    }
  }

  setTarget(target) {
    this.target = target;
    this.centreOnTarget();
  }

  setRadius(radius) {
    // createCircleBody(this.body, radius);
    // this.setPosition(
    //   this.target.x, 
    //   this.target.y
    // );
    this.body.setCircle(radius);
    this.centreOnTarget();
  }

  getTargetLocation() {
    return this.target.getTargetLocation();
  }

  getOrigin() {
    return this.target.getCenter();
  }

  centreOnTarget() {
    // centerBodyOnBody(this.body, this.target.body);
    // This does not behave consistently, i.e. the circle collider is not always centred on the body
    this.setPosition(
      this.target.x + this.target.displayWidth/2 - this.body.halfWidth, 
      this.target.y + this.target.displayHeight - this.body.halfHeight
    );
  }

  playSound(key) {
    // Enable the body only while sound is playing, it gets disable when the tween completes
    this.setEnable(true);
    this.scene.audio[key].play();
    
    // Sound volume, do this better
    this.volume = this.audio[key]['soundRadius'];

    if (this.showSoundWave) { 
      var postFxPipeline = this.scene.postFxPluginShockwave.add(this.scene.cameras.main, { waveRadius: 0, waveWidth: 40 });
      const waveSpeed = 0.8;

      // Expands the shockwave effect away from the target object at a constant speed
      this.scene.tweens.addCounter({
        from: 0,
        to: this.audio[key]['soundRadius'],
        duration: this.audio[key]['soundRadius']/waveSpeed,      
        onUpdate: function (tween) {
          postFxPipeline.setWaveRadius(tween.getValue());
          const targetCameraPos = this.getRelativePositionToCanvas(this.target, this.scene.cameras.main);
          postFxPipeline.setCenter(targetCameraPos.x, targetCameraPos.y);
        }.bind(this),
        onComplete: function (tween) {
          this.scene.postFxPluginShockwave.remove(this.scene.cameras.main);
        }.bind(this)
      });   
    }

    this.scene.tweens.addCounter({
      from: 5,
      to: this.audio[key]['soundRadius'],
      duration: this.audio[key]['duration'],
      yoyo: true,
      onUpdate: function (tween) {
        this.setRadius(tween.getValue());
        // this.body.setCircle(tween.getValue())
        // this.centreOnTarget()
      }.bind(this),
      onComplete: function (tween) {
        this.setEnable(false); 
      }.bind(this)
    });        
  } 

  getRelativePositionToCanvas(gameObject, camera) {
    return {
      x: (gameObject.x - camera.worldView.x) * camera.zoom,
      y: (gameObject.y - camera.worldView.y) * camera.zoom
    }
  }
}
