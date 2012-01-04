var anew = require("../libs/anew")

var standard = anew({}, {

    constructor: function(){
        this.offset = {x: 0.5, y: 0}
    },

    image: "weapon_standard",
    x: 0,
    y: 0,
    width: 10,
    height: 20,
    speed: 0.5,
    slipperiness: 1,
    
    on_add: function(){
        this.vel = {speed: this.speed, direction: Math.PI}
    }
})



//exports

module.exports = {
    standard: standard
}
