var anew = require("../libs/anew"),
    weapons = require("./player_weapons")

var player = anew({
    
    constructor: function(){
        this.vel = {
            direction: 0,
            speed: 0
        }
    },
    game: undefined,
    x: 150,
    y: 500,
    width: 50,
    height: 60,

    speed: 0.2,

    friction: 1,
    weapon: weapons.standard, 

    draw: function(context){
        context.fillStyle = "#eee"
        context.fillRect(this.x, this.y, this.width, this.height)
    },

    // --- UPDATE STUFF --- //
    update: function(td){
       
        // actions
        this._firing()
        this._flying()
    },

    // --- UPDATE HELPERS --- //
    
    _firing: function(){
        
        if ( !this.game.input.fire ) return 

        var bullet = anew(this.weapon)
        bullet.x = this.x + (bullet.offset.x * this.width ) - (bullet.width / 2)
        bullet.y = this.y + (bullet.offset.y * this.height ) - (bullet.height / 2)
        
        this.game.add(bullet)
    },
    
    _flying: function(){
        var input = this.game.input,
            pi = Math.PI,
            updown_p    = input.up || input.down
            leftright_p = input.left || input.right
        
        // single button
        if ( input.up && !leftright_p ) this._set_vel(pi, this.speed)
        if ( input.down && !leftright_p ) this._set_vel(0, this.speed)
        if ( input.right && !updown_p ) this._set_vel(pi/2, this.speed)
        if ( input.left && !updown_p ) this._set_vel(pi * 1.5, this.speed)
        

        // diagonal 
        if ( input.up && input.right ) this._set_vel(pi * 0.75, this.speed)
        if ( input.up && input.left ) this._set_vel(pi * 1.25, this.speed)
    
        if ( input.down && input.left ) this._set_vel(pi * 1.75, this.speed)
        if ( input.down && input.right ) this._set_vel(pi * 0.25, this.speed)
    }, 

    _set_vel: function(direction, speed){
        this.vel.direction = direction
        this.vel.speed = speed
    }
    

})


module.exports = player
