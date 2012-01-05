var anew = require("../libs/anew"),
    base = require("./base_entity"),
    weapons = require("./weapons")

var base_enemy = anew(base, {


    constructor: function(){
        this.gun = {}
        this.gun.y =  this.height
        this.gun.x =  (this.width / 2) 
    },
    type: "enemy",
    weapon: weapons.standard,
    _firing: function(dir){


        if ( this._weapon_cooldown ) return 
        
        // create new bullet
        var bullet = anew(this.weapon)
        bullet.x = this.gun.x + this.x
        bullet.y = this.gun.y + this.y
        bullet.vel.direction = dir
        bullet.type = "enemy_weapon"

        this.game.add(bullet)
        
        // handle cooldown
        this._weapon_cooldown = true

        this.game.delay(function(){
            this._weapon_cooldown = false
        }.bind(this), this.weapon.rate)

    },
})

module.exports = {
    
    peon: anew(base_enemy, {
        
        draw: function(context){
            context.fillStyle = "#eee"
            context.fillRect(this.x, this.y, this.width, this.height)
        },
        update: function(){
            this.vel.speed = 0.1
            this._firing(0)
        
            if ( this.x < 100 ) this.vel.direction = Math.PI * 0.5
            else if ( this.x + this.width > 400 ) this.vel.direction = Math.PI * 1.5
        }
        
    })
}
