class SummaryScreen extends Phaser.Scene {
	constructor() {
		super({key: 'SummaryScreen'});
	}

  preload() {
		this.load.image('background', 'assets/sprites/display/backgrounds/background.png');
    this.load.html('nameform', 'assets/text/nameform.html');
  }

  create(data={score: int, currentScene: Phaser.Scene}) {
    this.input.keyboard.disableGlobalCapture(); // Stop Phaser from intercepting wasd keys
		let {width, height} = this.sys.game.canvas;
 
    var background = this.add.image(0, 0, 'background').setOrigin(0, 0);
    background.displayWidth = width;
    background.displayHeight = height;
    
    // Score text
    // this.add.rectangle(width/2, height/4+4, width/2, 42, 0x101010, 0.8).setOrigin(0.5, 0.5);
    // this.add.graphics().fillRoundedRect(
    //   width/2, 
    //   height/4+4, 
    //   width/2, 
    //   42, 
    //   8
    // ).setDepth(999).fillStyle(0x000000, 0.75);
		this.add.bitmapText(width/2, height/4, 'meyrin', `Score: ${data.score}`, 42).setOrigin(0.5).setDropShadow(4, 4, 0x000000);
   
    // html form
    var element = this.add.dom(width/2, 3*height/4).createFromCache('nameform');
    element.addListener('click');
    element.on('click', function (event) {
      if (event.target.name === 'submitButton') {
        var inputText = element.getChildByName('nameField');

        // Have they entered anything?
        if (inputText.value !== '') {
          // Turn off the click events
          // element.removeListener('click');
          
          // Check for swear words before submitting the score
          this.profanityTest(inputText.value).then(function(response) {
            if (response.containsprofanity) {

              // Add a class that defines an animation
              inputText.classList.add('error');

              // remove the class after the animation completes
              setTimeout(function() {
                inputText.classList.remove('error');
              }, 300);

              // element.addListener('click');
            } else {
              var userData = {
                name: inputText.value,
                score: data.score
              }; 
              this.submitScore(userData).then(function(data) {
                this.restartGame();
              }.bind(this)).catch(function(err) {
                console.log(err);
              });
            }
          }.bind(this)).catch(function(err) {
            console.log(err)
          });
        }
      }
       
      if (event.target.name === 'skipButton') {
        this.restartGame();
      }     

    }.bind(this));
  }

  profanityTest(text) {
    return new Promise(function(resolve, reject) {
      $.ajax({
        type: 'GET',
        url: '/profanity-test',
        contentType: 'application/json; charset=utf-8',
        data: {text: text},
        success: function(response) {
          resolve(response);
        },
        error: function(error) {
          reject(error)
        }
      });
    });
  }

  submitScore(userData) {
    return new Promise(function(resolve, reject) {
      $.ajax({
        type: 'POST',
        url: '/submit-score',
        contentType: 'application/json; charset=utf-8',
        data: JSON.stringify(userData),
        success: function(response) {
          resolve(response);
          updateScores(); // This is defined in index.html
        },
        error: function(error) {
          reject(error)
        }
      });
    });
  }

  restartGame() {   
    this.scene.start('StartScene', { fadeIn: true });
    this.scene.stop();
  }
}
