var anew = require("../libs/anew"),
    enemies = require("./enemies")


var levels = [
    [
        {type: "peon", time: 0}
    
    ]

]


var game_manager = anew({
    
    game: undefined,
    current_level: 0,   

    on_add: function(){
        this.load_level(0)
    },

    load_level: function(num){
        var spec = levels[num],
            game = this.game
        
        // if run out of levels, you've won
        if ( !spec ) this.win()

        // else make enemies
        spec.forEach(queue_enemy)
        
        function queue_enemy(spec){
            var enemy = anew(enemies[spec.type], spec.options)
            
            game.delay(function(){
                console.log(enemy)
                game.add(enemy)
            }, spec.time * 1000)
        }
    },

    update: function(){
    },

    win: function(){
        console.log("you've won!")
    }

    
})



module.exports = game_manager
