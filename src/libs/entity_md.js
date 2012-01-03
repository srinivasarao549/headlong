void function(context){

   // main controlling object
    var entity_md = {
        
        // ctor and attrs
        init: function(){
            this._entities = []
        },
        _entities_modified: false,
    
//----------------------------------------------------------//
//              OBJECT TRACKING METHODS
//----------------------------------------------------------//
    
        add: function(object){
            // store
            this._entities.push(object)
            this._entities_modified = true
            return object
        },
                
        remove: function(object){
            var index = this._entities.indexOf(object)
            if ( index >= 0 ){
                this._entities.splice(index, 1)      
                this._entities_modified = true                      
            }
        },
        
        remove_all: function(){
            this._entities = []
        },
        
        find_instances: function(ctor, obj_set){
            var objs = obj_set || this._entities,
                return_objs = []
            
            objs.forEach(function(o){
                if ( o.constructor == ctor ) 
                    return_objs.push(o)
            })
            return return_objs
        },
        
        find_nearest: function(reference_object, obj_set){
            var objs = obj_set || this._entities,
                nearest_obj, nearest_distance
            
            objs.forEach(function(o){
                var diffx = Math.abs(reference_object.x - o.x),
                    diffy = Math.abs(reference_object.y - o.y),
                    distance = diffy*diffy + diffx*diffx
                    
                if ( nearest_distance === undefined ){    
                    nearest_distance = distance
                    nearest_obj = o
                } else if ( nearest_distance > distance ){
                    nearest_distance = distance
                    nearest_obj = o
                }
            })

            return nearest_obj
        },

        find_by_attr: function(attr_object, object_set){
            var search_in = object_set || this._entities,
                objects

            function check_attrs(attr_object, object){
                var success = false
                Object.keys(attr_object).forEach(function(key){
                    if ( object[key] == attr_object[key] ) success = true
                })
                return success
            }

            objects = search_in.filter(function(object){
                return check_attrs(attr_object, object)
            })
            
            return objects
        }
        
    };

    module.exports = entity_md
}(this)
