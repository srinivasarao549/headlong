var anew = require("../libs/anew")

var standard = anew({}, {
    

    constructor: function(){
        this.offset = {x: 0.5, y: 0}
    },

    image: "weapon_standard",
    x: 0,
    y: 0,
    width: 10,
    height: 10,
    speed: 0.5,
    
    update: function(td){
        this.y -= this.speed * td

        if ( this.y < 100 ) this.game.remove(this)
    }

})



//exports

module.exports = {
    standard: standard
}
