window.onload = function init(){
  var game = new GameLife();
  game.start();
};


/*Game life cycle*/
var GameLife = function(){
  /*******************VARIABLES********************/ 
  var canvas, ctx, lDisplay, hDisplay;

  var score = 0;
  var scoreContainer;
  var multScore = 100; //Lance une animation à chaque multScore
  var totalScore = 0;

  var delta = 0, oldTime = 0;
  var frameCount = 0;
  var lastTime, fpsContainer, fps = "Loading";

  var states = {
    mainMenu : 0,
    inGame : 1,
    gameOver : 2,
    waitGame : 3,
    scoreMenu : 4,
    rulesMenu : 5
  };
  var inputStates = {};
  var currentState = states.mainMenu;
  var isPaused = false;

  var mob;
  var speedMob = 5;

  var spikeArray = [];
  var speedSpikes = 100;
  var spikesNumber = 3;
  
  var lifeArray = [];
  var newLife;
  var timeDisplayLife;
  var numberOfLife = 3;

  //Image
  var imgLife = new Image();
  imgLife.src = "heart_32.png"; 

  function timer(currentTime){
    var delta = currentTime - oldTime;
    oldTime = currentTime;
    return delta;
  }
 
  /********************GAME LIFE****************/
  var gameLoop = function(time){
    //clearCanvas();
    ctx.clearRect(0,0,lDisplay,hDisplay);
    
    if(mob.mobAlive() === false){
      currentState = states.gameOver;
    }
    
    switch(currentState){
      case states.mainMenu:  
        displayMainMenu();
        break;

      case states.inGame:
        //Down menu
        ctx.font="30px verdana";
        ctx.fillStyle = "white";
        ctx.fillRect(0,hDisplay-50,lDisplay,2);
        ctx.fillStyle = "rgba(0,0,139,0.3)";
        ctx.fillRect(0,hDisplay-48,lDisplay,55);

        if(isPaused === false){ //bug connu : lorsque le jeu est en pause, les Spikes continuent de se déplacer
           //Display
          displayFPS(time);
          delta = timer(time);
          score++;
          displayScore();

          //Add new spike       
          totalScore = getScore();  
          if(totalScore%multScore == 0 && totalScore != 0){
            addSpike();
            score += 25;
          }

          //Display new life
          if(totalScore%(multScore*5) == 0 && totalScore != 0 && lifeArray.length < 10){
            popNewLife();
            timeDisplayLife = new Date().getTime();
          }
          
          if(timeDisplayLife != 0){
            var tempTimeLife = new Date().getTime();
            if(tempTimeLife != 0 && tempTimeLife-timeDisplayLife < 3000){    
              newLife.drawLife(); 
            } else {
              timeDisplayLife = 0;
            }
          }
          //Update all the moves
          updateMob();
          updateSpikes(delta);
          updateLife();

        } else {
           //Let display down-menu
          displayFPS(time);
          displayScore();
          updateLife();
    
          ctx.strokeStyle = "white";
          ctx.strokeRect(400,270,500,210);
          ctx.strokeRect(400,330,500,1);
          ctx.fillStyle = "rgba(34,139,34,0.5)";
          ctx.fillRect(400,270,500,210);
          ctx.font="30px verdana";
          ctx.fillStyle = "white";
          ctx.fillText("Pause",600,310);
          ctx.fillText("Release P to resume the game !",410,415);
        }      
        break;

      case states.gameOver:
          displayGameOver();
        break;
        case states.scoreMenu:
          displayBestScores();
        break;
        case states.rulesMenu:
          displayRules();
        break;
    }
    requestAnimationFrame(gameLoop);   
  };
  
  var calcDistanceToMove = function(delta, speed){
    return (speed*delta)/1000;
  };
  
  //Display the FPS
  var displayFPS = function(newTime){
    //first invoke
    if(lastTime === undefined){
      lastTime = newTime;
      return;
    }  
    //calculate differences
    var diffTime = newTime - lastTime;
      if(diffTime >= 1000){
        fps = frameCount;
        frameCount = 0;
        lastTime = newTime;
      }  
    //display
    ctx.fillStyle = "white";
    ctx.fillText('FPS:'+fps,10,hDisplay-10);
    frameCount++;    
  };      
  
  var getScore = function(){return score;};

  //Display the score
  var displayScore = function(){
    ctx.fillStyle = "white";
    ctx.fillText('Score:'+score,(lDisplay/2)-50,hDisplay-10);
  };

  var displayMainMenu = function(){
    ctx.save(); 
    ctx.shadowBlur = "20";
    ctx.shadowColor = "black";     
    ctx.strokeStyle = "white";
    ctx.strokeRect(400,220,500,310);
    ctx.fillStyle = "rgba(0,0,139,0.5)";
    ctx.fillRect(400,220,500,310);
    ctx.strokeRect(400,280,500,1);
    ctx.font="30px verdana";
    ctx.fillStyle = "white";
    ctx.fillText("Main menu",570,260);
    ctx.fillText("Press 'ENTER' to play !",485,345);
    ctx.fillText("Press 'S' to see best scores.",445,405);
    ctx.fillText("Press 'R' to read the rules.",455,465);
    ctx.restore();

    if(inputStates.enter){
      restartGame();
    } else if(inputStates.scores){
      currentState = states.scoreMenu;
    } else if(inputStates.rules){
      currentState = states.rulesMenu;
    }
  };

  var displayGameOver = function(){
    ctx.save();
    ctx.shadowBlur = "20";
    ctx.shadowColor = "black";
    ctx.strokeStyle = "white";
    ctx.strokeRect(400,270,570,210);
    ctx.fillStyle = "rgba(165,42,42,0.5)";
    ctx.fillRect(400,270,570,210);
    ctx.font="30px verdana";
    ctx.fillStyle = "white";
    ctx.fillText("Game Over.",600,320);
    var scoreSentence = "";
    if(score < 500){
      scoreSentence = "Very bad...";
      ctx.fillText("Score: "+score+". "+scoreSentence,525,380);
    } else if(score >= 500 && score < 2000){
      scoreSentence = "Not bad !";
      ctx.fillText("Score: "+score+". "+scoreSentence,525,380);
    } else if(score >= 2000 && score < 5000){
      scoreSentence = "You're good !";
      ctx.fillText("Score: "+score+". "+scoreSentence,485,380);
    } else if(score >= 5000){
      scoreSentence = "Damned, you're a god !";
      ctx.fillText("Score: "+score+". "+scoreSentence,405,380);
    }
    ctx.fillText("Press 'ENTER' to start a new game !",415,445);
    ctx.restore();
    
    if(inputStates.enter){
      restartGame();
    }
  };

  var displayBestScores = function(){
    //Display best scores
    ctx.save(); 
    ctx.shadowBlur = "20";
    ctx.shadowColor = "black";     
    ctx.strokeStyle = "white";
    ctx.strokeRect(380,220,540,310);
    ctx.fillStyle = "rgba(255,215,0,0.5)";
    ctx.fillRect(380,220,540,310);
    ctx.strokeRect(380,280,540,1);
    ctx.font="30px verdana";
    ctx.fillStyle = "white";
    ctx.fillText("Best Scores",570,260);
    ctx.font="23px verdana";
    ctx.fillText("1. Toto : 9450 points",400,320);
    ctx.fillText("2. Tata : 8514 points",400,355);
    ctx.fillText("3. Titi : 3450 points",400,390);
    ctx.fillText("4. Tutu : 245 points",400,425);
    ctx.fillText("5. Unregistred",400,460);
    ctx.font="20px verdana";
    ctx.fillText("'BACKSPACE' to back to the menu",480,515);
    ctx.restore();
    
    //Back to menu
    if(inputStates.backspace){
      currentState = states.mainMenu;
    }
  };

  var displayRules = function(){
    //Display the rules of this game
    ctx.save(); 
    ctx.shadowBlur = "20";
    ctx.shadowColor = "black";     
    ctx.strokeStyle = "white";
    ctx.strokeRect(350,170,600,440);
    ctx.fillStyle = "rgba(169,169,169,0.5)";
    ctx.fillRect(350,170,600,440);
    ctx.strokeRect(350,230,600,1);
    ctx.font="30px verdana";
    ctx.fillStyle = "white";
    ctx.fillText("Rules",600,210);
    ctx.font="25px verdana";
    ctx.fillText("You're a poporing. You will start with "+numberOfLife+" lifes.",370,270);
    ctx.fillText("Your goal is to avoid all the spikes. If a spike",370,310);
    ctx.fillText("hit the poporing, you loose a life. You can get",370,350);
    ctx.fillText("extra life every "+multScore*5+" points. This new life",370,390);
    ctx.fillText("appears while 3 secondes only. Furthermore,",370,430);
    ctx.fillText("a shield protect the poporing during 1.5",370,470);
    ctx.fillText("seconds after being hit. You can destroy",370,510);
    ctx.fillText("spikes with this shield ! Have fun ! :)",370,550);
    ctx.font="20px verdana";
    ctx.fillText("'BACKSPACE' to back to the menu",480,595);
    ctx.restore();
    
    //Back to menu
    if(inputStates.backspace){
      currentState = states.mainMenu;
    }
  };
  
  var restartGame = function(){
    score = 0;
    spikeArray = [];
    createSpikes(spikesNumber);
    initLife(numberOfLife);
    timeDisplayLife = 0; //new life disapear
    mob.setInvincibility(false);
    mob.setMobAlive(true);
    currentState = states.inGame;
  };

/********************MOB***********************/
  var Mob = function(X, Y, R){
    var x = X||100;
    var y = Y||100;
    var radMob = R||25;

    var alive = true;
    var speedMob = 5;

    var invincibility = false;
    var invincibilityAnimation = true;
    var timeAnimation = 0;
    var animationDelay = 100;
  
    var imgMob = new Image();
    imgMob.src = "oneMob.png";    
    
    var speedX = 0;
    var speedY = 0;
  
    var time = 0;

    var move = function(x ,y){
      speedX = x;
      speedY = y;
    };
  
    var refresh = function(ctx){
      if(x+speedX+speedMob <= 1360 && x+speedX+speedMob >= 35){ 
          x += speedX;
      }
      if(y+speedY+speedMob <= 750 && y+speedY+speedMob >= 35){
          y += speedY;
      }

      if(timeDisplayLife != 0){
        //Check is the mob collide with a life on the map
        if(newLife.circCollideLife(x, y, radMob-5, newLife.getXLife(),newLife.getYLife(), newLife.getRadiusLife())){               
          addLife(1,lifeArray.length);
          timeDisplayLife = 0; //delete the life drawing
        }   
      }
  
      //draw the mob
      ctx.save();
      ctx.translate(x, y);  
      ctx.drawImage(imgMob,0,0,50,50,-radMob,-radMob,2*radMob,2*radMob);
      ctx.restore();  
    };
    
    //Getter/Setter
    var getX = function(){return x;};
    var getY = function(){return y;};
    var setX = function(x1){x = x1;};
    var setY = function(y1){y = y1;};
    var getAlive = function(){return alive;};
    var setAlive = function(A){alive = A;};
    var getInvincibility = function(){return invincibility;};
    var setInvincibility = function(invinc){invincibility = invinc;};
    var getInvincibilityAnimation = function(){return invincibilityAnimation;};
    var setInvincibilityAnimation = function(time){invincibilityAnimation = time;};
    var getTimeAnimation = function(){return timeAnimation;};
    var resetTimeAnimation = function(){timeAnimation = new Date().getTime();}
    var getRadMob = function(){return radMob;};
    var setTime = function(time1){time = time1;};
    var getTime = function(){return time;};
    var getAnimationDelay = function(){return animationDelay;};
    var setAnimationDelay = function(time){animationDelay = time;};

    return { 
      deplaceMob: move,
      drawMob: refresh,
      mobX: getX,
      mobY:getY,
      setXMob:setX,
      setYMob:setY, 
      mobAlive:getAlive,
      setMobAlive:setAlive,
      getInvincibility:getInvincibility,
      setInvincibility:setInvincibility,
      getInvincibilityAnimation:getInvincibilityAnimation,
      setInvincibilityAnimation:setInvincibilityAnimation,
      getTimeAnimation:getTimeAnimation,
      resetTimeAnimation:resetTimeAnimation,
      getRadMob:getRadMob,
      setInvincible:setTime,
      getInvincible:getTime,
      getAnimationDelay:getAnimationDelay,
      setAnimationDelay:setAnimationDelay
    };
  };
  
  function updateMob(){
    var sX = 0;
    var sY = 0;
    var mult = 1;

    if(inputStates.left){
      sX -= speedMob;
    }
    if(inputStates.right){
      sX += speedMob;
    }
    if(inputStates.up){
      sY -= speedMob;
    }
    if(inputStates.down){
      sY += speedMob;
    }    
    if(inputStates.space){
      mult = 2;
    }  
    mob.deplaceMob(sX*mult, sY*mult); 
    mob.drawMob(ctx);

    //if a spike hit the mob
    if(mob.getInvincibility()){ //true
      if(mob.getInvincibilityAnimation()){
        ctx.save();
        var imgShield = new Image();
        imgShield.src = "shieldAnimation.png"

        //Add the shield on the mob
        ctx.drawImage(imgShield,mob.mobX()-25,mob.mobY()-25,50,50);
        ctx.restore();
      } 

      //Animation of the shield
      var diffTime = new Date().getTime()-mob.getInvincible();
      if((diffTime >= 500)  && (new Date().getTime()-mob.getTimeAnimation() >= mob.getAnimationDelay())){
        mob.setAnimationDelay(mob.getAnimationDelay()-5);
        mob.setInvincibilityAnimation(!mob.getInvincibilityAnimation());
        mob.resetTimeAnimation();
      }
    }   
  }
  /***********************SPIKES************************/
  var Spike = function(X, Y, A, V, Diam){ 
    var x = X;
    var y = Y;
    var angle = A;
    var speed = V;
    var radius = Diam/2;
    
    var imgSpike = new Image();
    imgSpike.src = "spike.png"; 

    var refresh = function(){
      ctx.save();
      ctx.translate(x,y);
      ctx.drawImage(imgSpike,-radius,-radius,2*radius,2*radius);
      ctx.restore();
    };  
    var move = function(){
      var incX = speed*Math.cos(angle);
      var incY = speed*Math.sin(angle);
    
      x += calcDistanceToMove(delta, incX);
      y += calcDistanceToMove(delta, incY);  
    };
    
    var testCollisionWithWalls = function(){
      //left
      if(x < radius){
        x = radius;
        angle = -angle + Math.PI;
      }
      //right
      if(x > lDisplay-(radius)){
        x = lDisplay-(radius);
        angle = -angle + Math.PI;
      }
      //up
      if(y < radius){
        y = radius;
        angle = -angle;
      }
      //down
      if(y > hDisplay-(radius)-50){
        y = hDisplay-(radius)-50;
        angle = -angle;
      }
    };
    
    var circRectsOverlap = function(x0, y0, l0, h0, cx, cy, r){
      var testX = cx;
      var testY = cy;
      
      if(testX < x0) testX = x0;
      if(testX > (x0+l0)) testX = (x0+l0);
      if(testY < y0) testY = y0;
      if(testY > (y0+h0)) testY = (y0+h0);
      
      return (((cx-testX)*(cx-testX)+(cy-testY)*(cy-testY))<r*r);
    };

    var circleCollide = function(x1, y1, r1, x2, y2, r2) {      
      var dx = x1 - x2;
      var dy = y1 - y2;
      return ((dx * dx + dy * dy) < (r1 + r2)*(r1+r2));  
   };
    
    var getX = function(){return x;};
    var getY = function(){return y;};
    var getRadius = function(){return radius;};
    
    var calcDistanceToMove = function(delta, speed){
      return (speed*delta)/1000;
    };

    return {
      drawSpikes: refresh,
      deplaceSpikes: move,
      testCollision: testCollisionWithWalls,
      circRects: circRectsOverlap,
      circCollide: circleCollide,
      spikeX:getX,
      spikeY:getY,
      radius:getRadius,
      calcDistanceToMove:calcDistanceToMove
    };
  };

  //Init the array spikes for a new game
  function createSpikes(number){
    for(var i = 0; i < number; i++){
      var spike = new Spike(lDisplay*Math.random(),(hDisplay-50)*Math.random(),(2*Math.PI)*Math.random(),speedSpikes,50);
      spikeArray[i] = spike;
    }
  }

  //Add a new spike on the map
  function addSpike(){
    spikeArray.push(new Spike(lDisplay*Math.random(),(hDisplay-50)*Math.random(),(2*Math.PI)*Math.random(),speedSpikes,50));
  }
  
  //Move all the spikes
  function updateSpikes(delta){
    for(var i = 0; i < spikeArray.length; i++){
      var spike = spikeArray[i];
      
      spike.deplaceSpikes();   
      spike.testCollision(); 
      
      if(mob.getInvincibility() === false){
        //if the mob touch one spike, he's dead
        if(spike.circCollide(mob.mobX(), mob.mobY(), mob.getRadMob()-5, spike.spikeX(), spike.spikeY(), spike.radius()) && (new Date().getTime()-mob.getInvincible()) > 1500){               
          delLife();
          spikeArray.splice(i,1);
          mob.setInvincibility(true);
          mob.setInvincibilityAnimation(true);
          mob.setAnimationDelay(100);
          mob.setInvincible(new Date().getTime());
          if(lifeArray.length == 0){
            mob.setMobAlive(false);  
          } 
        }  
      } else if((new Date().getTime()-mob.getInvincible()) > 1500){ //The mob is no longer invincible
        mob.setInvincibility(false);
      } else{ //If a spike touch the mob when the shield is activated, the spike is destroyed
        if(spike.circCollide(mob.mobX(), mob.mobY(), mob.getRadMob()-5, spike.spikeX(), spike.spikeY(), spike.radius())){               
          spikeArray.splice(i,1);
        }  
      }
      spike.drawSpikes(); 
    }
  }
    /*********************LIFE********************/ 
  var Life = function(X,Y,D){
    var x = X||lDisplay-24;
    var y = Y||hDisplay-24;
    var radius = D/2||15;

    var imgLife = new Image();
    imgLife.src = "heart_32.png"; 

    var refresh = function(){
      ctx.save();
      ctx.drawImage(imgLife,x-16,y-16,32,32);
      ctx.restore();
    };

    var setX = function(x1){x -= x1;};
    var getX = function(){return x;};
    var getY = function(){return y;};
    var getRadius = function(){return radius;};

    var circleCollide = function(x1, y1, r1, x2, y2, r2) {      
      var dx = x1 - x2;
      var dy = y1 - y2;
      return ((dx * dx + dy * dy) < (r1 + r2)*(r1+r2));  
   };

    return{
      drawLife:refresh,
      setXLife: setX,
      getXLife: getX,
      getYLife: getY,
      getRadiusLife: getRadius,
      circCollideLife: circleCollide
    }
  };

  //Init the number of life for a new game
  function initLife(number){
    for(var i = 0; i < number; i++){
      var life = new Life();
      life.setXLife(50*i);
      lifeArray[i] = life;
    }
  }

  //Add a new life 
  function addLife(number,arrayLength){
    var life = new Life();
    life.setXLife(arrayLength*50);
    lifeArray.push(life);
  }

  //Update the life 
  function updateLife(){
    for(var i = 0; i < lifeArray.length; i++){
      var life = lifeArray[i];
      life.drawLife();
    }
  }

  //Add a new life on the map
  function popNewLife(){
    newLife = new Life(lDisplay*Math.random(),(hDisplay-50)*Math.random(),30);
  }

  function delLife(){
    lifeArray.splice(lifeArray.length-1,1);
  }
    /*********************START THE GAME********************/
  var start = function(){ 
    //Canvas
    canvas = document.querySelector("#myCanvas");
    ctx = canvas.getContext("2d");
    lDisplay = canvas.width;
    hDisplay = canvas.height;

    //Personnage
    mob = new Mob();
    
    //Spikes
    createSpikes(spikesNumber);
    
    //Life
    initLife(numberOfLife);

    //add the listener to the main, window object, and update the states  
    window.addEventListener('keydown', function(event){  
        if (event.keyCode === 37) {  
           inputStates.left = true;  
        } else if (event.keyCode === 38){  
            inputStates.up = true;  
        } else if (event.keyCode === 39){  
            inputStates.right = true;  
        } else if (event.keyCode === 40){  
            inputStates.down = true;  
        } else if (event.keyCode === 32){  
            inputStates.space = true;  
        } else if(event.keyCode === 13){
            inputStates.enter = true;
        } else if(event.keyCode === 83){
            inputStates.scores = true;
        } else if(event.keyCode === 82){
            inputStates.rules = true;
        } else if(event.keyCode === 80){
            inputStates.pause = true;
            isPaused = true;
        } else if(event.keyCode === 8){
            inputStates.backspace = true;
        }     
    }, false);  
     
    //if the key will be released, change the states object   
    window.addEventListener('keyup', function(event){  
        if (event.keyCode === 37) {  
           inputStates.left = false;  
        } else if (event.keyCode === 38) {  
           inputStates.up = false;  
        } else if (event.keyCode === 39) {  
           inputStates.right = false;  
        } else if (event.keyCode === 40) {  
           inputStates.down = false;  
        } else if (event.keyCode === 32) {  
           inputStates.space = false;  
        } else if(event.keyCode === 13){
           inputStates.enter = false;
        } else if(event.keyCode === 83){
            inputStates.scores = false;
        } else if(event.keyCode === 82){
            inputStates.rules = false;
        } else if(event.keyCode === 80){
           inputStates.pause = false;
           isPaused = false;
        } else if(event.keyCode === 8){
          inputStates.backspace = false;
        }     
    }, false);        
    //start the animation
    requestAnimationFrame(gameLoop);
  }
  return {
    start: start
  };  
};