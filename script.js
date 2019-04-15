var platforms, player, cursors, stars, scoreText, bombs, gameOver;
var score = 0;

function preload (){
  this.load.image('sky', 'assets/sky.png');
  this.load.image('ground', 'assets/platform.png');
  this.load.image('star', 'assets/star.png');
  this.load.image('bomb', 'assets/bomb.png');
  this.load.spritesheet(
    'dude',
    'assets/dude.png',
    { frameWidth: 32, frameHeight: 48 }
  );
}

function create ()
{
  // stage
  // NOTE: this は scnene オブジェクト
  // add はfactoryオブジェクトがまとめられているネームスペース
  this.add.image(400, 300, 'sky');
  platforms = this.physics.add.staticGroup();

  platforms.create(400, 568, 'ground').setScale(2).refreshBody();

  platforms.create(600, 400, 'ground');
  platforms.create(50, 250, 'ground');
  platforms.create(750, 280, 'ground');

  // player
  // 引数の意味
  // https://photonstorm.github.io/phaser3-docs/Phaser.Physics.Arcade.Factory.html#sprite
  // sprite(x, y ,key)
  // sprite: 妖精, 小鬼, アニメーションやinput eventや物理ボディをもつ
  player = this.physics.add.sprite(100, 450, 'dude');
  // 跳ね返り
  // player.setBounce(0.2);

  // https://photonstorm.github.io/phaser3-docs/Phaser.Physics.Arcade.Body.html#setCollideWorldBounds
  // 世界の端で跳ね返るようにする
  player.setCollideWorldBounds(true);
  // 重力を設定する
  // https://photonstorm.github.io/phaser3-docs/Phaser.Physics.Arcade.Body.html#setGravityY__anchor
  player.body.setGravityY(50);

  // https://photonstorm.github.io/phaser3-docs/Phaser.Physics.Arcade.Factory.html#collider
  // collider(object1, object2 [, collideCallback] [, processCallback] [, callbackContext])
  // 地面とプレイヤーが反発するようにする
  this.physics.add.collider(player, platforms)

  // https://photonstorm.github.io/phaser3-docs/Phaser.Animations.AnimationManager.html#create
  // Creates a new Animation and adds it to the Animation Manager.
  this.anims.create({
    key: 'left',
    frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }), // https://photonstorm.github.io/phaser3-docs/Phaser.Animations.AnimationManager.html#generateFrameNumbers
    frameRate: 10,
    repeat: -1                  // Number of times to repeat the animation (-1 for infinity)
  });

  this.anims.create({
    key: 'turn',
    frames: [ { key: 'dude', frame: 4 } ],
    frameRate: 20
  });

  this.anims.create({
    key: 'right',
    frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
    frameRate: 10,
    repeat: -1
  });

  // star group
  // https://photonstorm.github.io/phaser3-docs/Phaser.Physics.Arcade.Factory.html#group__anchor
  stars = this.physics.add.group({
    key: 'star',
    repeat: 11,
    setXY: { x: 12, y: 0, stepX: 70 }
  });
  // chilren は グループに参加している子供
  stars.children.iterate(function(child){
    // 縦の反発力
    child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8))
  })
  // 地面と反発するように
  this.physics.add.collider(stars, platforms);
  // https://photonstorm.github.io/phaser3-docs/Phaser.Physics.Arcade.Factory.html#overlap__anchor
  // プレイヤーと衝突した時の処理
  // collider ではなく overlap にすることで跳ね返りをなくす（下からプレイヤーが触った場合に）
  this.physics.add.overlap(player, stars, collectStar, null, null);

  // score
  // 16 は座標
  scoreText = this.add.text(16, 16, 'Score: 0', { frontSize: '32px', fill: '#000' })

  // bomb
  bombs = this.physics.add.group();
  this.physics.add.collider(bombs, platforms);
  this.physics.add.collider(player, bombs, hitBomb, null, this)
}

function hitBomb(player, bomb) {
  this.physics.pause();
  player.setTint(0xff0000);
  player.anims.play('turn');
  gameOver = true;
}

function collectStar(player, star) {
  // https://photonstorm.github.io/phaser3-docs/Phaser.Physics.Arcade.Sprite.html#disableBody
  // disableBody( [disableGameObject] [, hideGameObject])
  // disableGameObject: also deactive this game object ゲームオブジェクトを残す
  // hideGameObject: Also hide this game object 表示を消す
  star.disableBody(true, true);
  score += 10;
  scoreText.setText(`Score: ${score}`)

  // https://photonstorm.github.io/phaser3-docs/Phaser.GameObjects.Group.html#countActive
  // countActive( [value])
  // value: true -> count active, false > count inactive
  if(stars.countActive(true) === 0) {
    stars.children.iterate((child) => {
      // TODO: enableBody の引数
      child.enableBody(true, child.x, 0, true, true)
    })

    // NOTE: Player の反対側に出している
    let x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);
    // TODO: create について調べる
    let bomb = bombs.create(x, 16, 'bomb');
    bomb.setBounce(1);
    bomb.setCollideWorldBounds(true);
    bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
  }
}

function update ()
{
  cursors = this.input.keyboard.createCursorKeys();

  // キーボードの設定処理
  if (cursors.left.isDown)
  {
    player.setVelocityX(-160);

    player.anims.play('left', true);
  }
  else if (cursors.right.isDown)
  {
    player.setVelocityX(160);

    player.anims.play('right', true);
  }
  else
  {
    player.setVelocityX(0);

    player.anims.play('turn');
  }

  if (( cursors.space.isDown || cursors.up.isDown ) && player.body.touching.down)
  {
    player.setVelocityY(-330);
  }
}

var config = {
  type: Phaser.AUTO,            // canvas を使うか webgl を使うかを auto 判定
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',          // physics システムを arcade を使う
    arcade: {
      gravity: { y: 300 },      // 300 は重力
      debug: false
    }
  },
  scene: {                      // TODO: イベントのメソッドを対応させているのか
    preload: preload,
    create: create,
    update: update
  }
};

var game = new Phaser.Game(config);
