var entity_md = require("./libs/entity_md"),
    anew = require("./libs/anew")

var game = anew(entity_md, {

    // add game objects to all added objects
    // and call their on_add handler
    add: function(object){
        entity_md.add.apply(this, arguments)
        object.game = this
        if ( object.on_add ) object.on_add()
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
            
            if ( !entity.vel ) return
            if ( entity.apply_physics == false ) return 
            
            if ( !entity.momentum ) 
                entity.momentum = { x: 0, y: 0 }
    
            var old_x = entity.x,
                old_y = entity.y
 
            console.log(entity.momentum.x, entity.momentum.y)
            // apply 
            entity.x += entity.momentum.x * time_delta
            entity.y += entity.momentum.y * time_delta

            // apply vel
            entity.x += time_delta * Math.sin(entity.vel.direction) * entity.vel.speed
            entity.y += time_delta * Math.cos(entity.vel.direction) * entity.vel.speed
            
            // store momentum
            entity.momentum.x = (((entity.x - old_x)) * entity.slipperiness) / time_delta
            entity.momentum.y = (((entity.y - old_y)) * entity.slipperiness) / time_delta 
            // wipe vel
            entity.vel.direction = 0
            entity.vel.speed = 0
        }
    }
})

module.exports = game
