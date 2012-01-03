var platform_md = require("./libs/platform_md"),
    anew = require("./libs/anew")

var game = anew(platform_md, {

    // add game objects to all added objects
    add: function(object){
        platform_md.add.apply(this, arguments)
        object.game = this
    },
    
    check_entity_collision: function(){
        this._entities.forEach(function(entity){
            if ( entity.pre_check_collision ) entity.pre_check_collision()
        })

        platform_md.check_entity_collision.apply(this, arguments)
    },

    move_entities: function(time_delta){
        
        this._entities.forEach(move_entity)
        
        function move_entity(entity){
            
            if ( entity.apply_physics == false ) return 
            

        }
    }
})

module.exports = game
