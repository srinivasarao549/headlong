var entity_md = require("./libs/entity_md"),
    anew = require("./libs/anew")

var game = anew(entity_md, {

    // add game objects to all added objects
    add: function(object){
        entity_md.add.apply(this, arguments)
        object.game = this
    },
    
    check_entity_collision: function(){

    },

    update_entities: function(time_delta){
        this._entities.forEach(function(e){
            if ( e.update ) e.update(time_delta)
        })
    },
    
    draw_entities: function(){
        var context = this.context,
            canvas = context.canvas,
            images = this.images

        context.clearRect(0, 0, canvas.width, canvas.height)

        this._entities.forEach(function(e){
            if ( e.image ) context.drawImage(images[e.image], ~~e.x, ~~e.y, ~~e.width, ~~e.height)
            if ( e.draw ) e.draw(context)
        })
    },

    move_entities: function(time_delta){
        
        this._entities.forEach(move_entity)
        
        function move_entity(entity){
            
            if ( entity.apply_physics == false ) return 
            

        }
    }
})

module.exports = game
