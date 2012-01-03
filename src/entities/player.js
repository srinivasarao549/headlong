var anew = require("../libs/anew"),
    weapons = require("./player_weapons")

var player = anew({

    game: undefined,
    x: 150,
    y: 500,
    width: 50,
    height: 60,

    weapon: weapons.standard, 

    draw: function(context){
        context.fillStyle = "#eee"
        context.fillRect(this.x, this.y, this.width, this.height)
    },
    update: function(td){
        
        var input = this.game.input,
            game = this.game,
            self = this

        // handle movement
        var vector = input_to_vector(input)
        this.x += vector.x * td
        this.y += vector.y * td
        
        // handle firing
        fire(input)


        function input_to_vector(input){
            var vector = {x: 0, y: 0}
            
            if ( input.up ) vector.y -= 1
            if ( input.down ) vector.y += 1
            
            if ( input.left ) vector.x -= 1
            if ( input.right ) vector.x += 1
                
           return vector
        }
        
        function fire(input){
        
            if ( !input.fire ) return
            
            var bullet = anew(self.weapon)
            
            bullet.x = self.x + (bullet.offset.x * self.width) - (bullet.width / 2)
            bullet.y = self.y + (bullet.offset.y * self.height) - (bullet.height / 2)

            game.add(bullet)
        }
       

    }
    

})


module.exports = player
