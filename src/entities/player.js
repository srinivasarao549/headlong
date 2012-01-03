var anew = require("../libs/anew")


var player = anew({

    game: undefined,
    x: 0,
    y: 0,
    draw: function(context){
        context.fillRect(this.x, this.y, 100, 100)
    },
    update: function(td){
        
        var vector = input_to_vector(this.game.input)

        function input_to_vector(input){
            var vector = {x: 0, y: 0}
            
            if ( input.up ) vector.y -= 1
            if ( input.down ) vector.y += 1
            
            if ( input.left ) vector.x -= 1
            if ( input.right ) vector.x += 1
                
           return vector
        }
        
    }
    

})


module.exports = player
