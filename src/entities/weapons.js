var anew = require("../libs/anew"),
    base = require("./base_entity")

var weapon_base = anew(base, {
    constructor: function(){
        this.vel.direction = Math.PI
    }
})

module.exports = {

    standard : anew(weapon_base, {
        constructor: function(){
            this.offset = {x: 0.5, y: 0}
        },

        image: "weapon_standard",
        x: 0,
        y: 0,
        width: 10,
        height: 20,
        speed: .75,
        slipperiness: 1,
        
        rate: 75,
        on_add: function(){
            this.vel.speed = this.speed
        },
        update: function(){
            if ( this.y < 0 ) this.game.remove(this)
        }
    })


}
