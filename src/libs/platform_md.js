var anew = require("./anew"),
    clash = require("./clash"),
    entity_md = require("./entity_md")

    /* PLATFORM_MD */
    var platform_md = anew(entity_md, {
    
        init: function(){
            this.canvas = undefined
            this.context = undefined
        },

        // 'world' attributes
        gravity: 20,    // 'force' in force = mass * acceleration
        

// -------------------------------------------------
//      EXTENDED entity_md METHODS


        add: function(object){
            entity_md.add.apply(this, arguments)
            object.md = this
        },


// -------------------------------------------------
//      GAME LOOP METHODS
        
        update_entities: function(time_delta, time_stamp){
            function update_entity(entity){
                if ( entity.update ) entity.update(time_delta, time_stamp)
            }
            this._entities.forEach(update_entity)
        },

        draw_entities: function(){
            var context = this.context,
                canvas = this.canvas

            function draw_entity(entity){
                context.globalAlpha = entity.opacity || 1
                if ( entity.draw ) entity.draw(context, canvas)
                if ( entity.image ) draw_image(entity)
            }

            function draw_image(entity){
                context.drawImage(entity.image, entity.x, entity.y)
            }
            
            context.clearRect(0, 0, canvas.width, canvas.height)
            this._entities.forEach(draw_entity)
        },
    
        // TODO: give collision a 'has a', not 'is a' relationship w/ entity
        check_entity_collision: function(){
            
            var entities = this._entities

            function check_collision(entityA, entityB){
                if ( clash.aabb_aabb(entityA, entityB)
                     && entityA.check_collision ) entityA.check_collision(entityB)
            }

            function check_against_all_entities(entityA){
                entities.forEach(function(entityB){
                    check_collision(entityA, entityB)
                })
            }

            entities.forEach(check_against_all_entities)
        }
    
    })

    
    /* EXPORTS */
    if ( typeof module != "undefined" ) module.exports = platform_md
    else root["platform_md"] = platform_md

