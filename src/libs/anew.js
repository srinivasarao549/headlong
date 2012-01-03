var get_proto = Object.getPrototypeOf,
    init = "init"
    
function anew(proto, object){
  
    void function set_defaults(){
        if ( proto === undefined ) proto = {}
        if ( object === undefined ) object = {}
    }()

    function mixin_object(to, from){
        
        Object.keys(from).forEach(function(key){
            to[key] = from[key]
        })

    }
    
    function call_proto_inits(object, proto){
        
        // if we've reached the top of the stack, return
        if ( proto === Object.prototype ) return

        // in case proto is undefined
        if ( !proto ) proto = get_proto(object)
                     
        // recurse
        call_proto_inits(object, get_proto(proto)) 
        
        // apply while falling from stack 
        if ( proto[init] ) proto[init].apply(object)

    }
   
    var return_object = Object.create(proto)
    
    // mixin extra props
    mixin_object(return_object, object)

    // call all inits in prototype
    if ( proto instanceof Object ) call_proto_inits(return_object)
   
    // call init that's been mixed in, if any (call in case of null proto)
    if ( {}.hasOwnProperty.call(return_object, init) ) return_object[init]()
    
    return return_object
}

module.exports = anew
