var bean = require('./libs/bean'),
    flywheel = require('./libs/flywheel'),
    load_images = require('./libs/load_images'),
    anew = require("./libs/anew")

var game = require('./game')

/* GAME SETUP */

void function setup_canvas(){
    game.canvas = document.getElementById("main_canvas"),
    game.context = game.canvas.getContext("2d")
}()

void function setup_input(){
    var input = {
        
        left: false,
        right: false,
        up: false,
        down: false,
        fire: false,
    }

 
    // get controls
    bean.add(document, 'keydown', function(e){
        var k = e.which
        
        if (  k == 37) 
            input.left = true
        else if ( k == 39) 
            input.right = true
        else if ( k == 38)
            input.up = true
        else if ( k == 40)
            input.down = true
        else if ( k == 88 )
            input.fire = true

        // disable up, down and space for scrolling
        if ( k == 38 || k == 40 || k == 32 ) e.preventDefault()
    })

    bean.add(document, 'keyup', function(e){
        var k = e.which
       
        if (  k == 37) 
            input.left = false
        else if ( k == 39) 
            input.right = false
        else if ( k == 38)
            input.up = false
        else if ( k == 40)
            input.down = false
        else if ( k == 88 )
            input.fire = false

    })

    game.input = input

}()

void function get_image(){

    var images = {
    
        weapon_standard: "images/weapon_standard_v2.png"
    
    }
    
    load_images(images, function(images){
        game.images = images
        start_game()
    })
}()


function start_game(){
    
    // add first entities
    var player = require("./entities/player")

    game.add(anew(player))
   
    // spin
    flywheel(function(time_delta, time_stamp){
        
        game.move_entities(time_delta)
        game.check_entity_collision()
        game.update_entities(time_delta, time_stamp)
        game.draw_entities()
    
    }).start()

}