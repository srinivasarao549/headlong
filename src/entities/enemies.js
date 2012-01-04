var anew = require("../libs/anew"),
    base = require("./base_entity"),
    weapons = require("./weapons")

var base_enemy = anew(base, {
    type: "enemy",
    weapon: weapons.standard,
    _firing: function(dir){

        dir = dir || 0

        if ( this._weapon_cooldown ) return 
            
            // create new bullet
            var bullet = anew(this.weapon)
            bullet.x -= this.x
            bullet.y -= this.y
            
            this.game.add(bullet)
            
            // handle cooldown
            this._weapon_cooldown = true

            this.game.delay(function(){
                this._weapon_cooldown = false
            }.bind(this), this.weapon.rate)

    }
})

module.exports = {
    
    peon: anew(base_enemy, {
        
        constructor: function(){
        },
        draw: function(context){
            context.fillStyle = "#eee"
            context.fillRect(this.x, this.y, this.width, this.height)
        },
        update: function(){
            this.vel.speed = 0.1
            this._firing()
        }
        
    })
}
