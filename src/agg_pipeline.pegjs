{
   // remove commas and flatten
   // this works with our ("," expression*) ","? idiom 
   function cleanAndFlatten(arr) {
      var o = arr.map(part => clean(part))
                 .map(arr => arr[0])
      return o
   }
   // remove commas
   function clean(arr) {
        var o = arr.filter(word => word !== ',')
        return o
   }
   // array will always have elements of the form [ "key", ":", "value" ]
   function objOfArray(arr) {
        var ret = {}
        for(let tup of arr) {
            ret[tup[0]] = tup[2]
        }
        return ret
   }
   function toBool(e) {
        if (e === '0' || e === 'false') {
                return 0
        }
        if (e === '1' || e === 'true') {
                return 1
        }
        return e
   }
   // make sure that $project is either all inclusive or all exclusive
   // we perform this on the initial array before changing to an object
   // because it's easier for me to just use filter
   function checkExclusivity(arr) {
        // only need to check for 1 or 0 because we convert "true" and "false" to 
        // 1 and 0 resp
        var exclusive = arr.filter(el => el[0] !== '_id' && el[2] === 0) 
        var inclusive = arr.filter(el => el[2] !== 0) 
        if(exclusive.length > 0 && inclusive.length > 0) {
             error("Bad projection specification, cannot exclude fields other than '_id' in an inclusion projection: " + JSON.stringify(objOfArray(arr)), location())
        }
        return arr
   }
   // check that the list of required operators is present
   function checkRequiredOperators(arr, reqs) {
        var matches = arr.filter(el => reqs.includes(el[0]))
        if(matches.length !== reqs.length) {
          error("Missing required fields");
        }
        return arr
   }
   // check that a fieldPath starts with '$'
   function checkIsFieldPath(s) {
        if (s.charAt(0) !== '$') {
             error("Field paths must begin with '$', field path was: " + s, location())
        }
        return s
   }
   // check that the field does not start with '$'
   function checkIsNotFieldPath(s) {
        if (s.charAt(0) !== '$') {
            return s;
        }
        error("Field paths must begin with '$', field path was: " + s, location())
   }

   function cleanBackSlashes(ch) {
        if (ch instanceof Array) {
                return ch.join("")
        }
        return ch
   }
}

// We can have just one stage in an aggregation, or we can have an actual pipeline (array)
start   =      st:stage                                          
               { 
                      return [st] 
               }
        /      pipeline

pipeline = "[" st:stage stArr:("," stage)* ","? "]" 
            { 
                return [st].concat(cleanAndFlatten(stArr))
            }

// this is a dummy rule just so we don't need to write this same
// action for every stage
stage = sts:stage_syntax {
                           var obj = {} 
                           obj[sts[1]] = sts[3] 
                           return obj 
                         } 

stage_syntax =
          "{" addFields         ":" addFields_document          "}"
//      / "{" bucket            ":" bucket_document             "}"
//      / "{" bucketAuto        ":" bucketAuto_document         "}"
        / "{" collStats         ":" collStats_document          "}"
        / "{" count             ":" string                      "}"
        / "{" currentOp         ":" currentOp_document          "}"
//      / "{" "$facet"          ":" facet_document              "}"
        / "{" geoNear           ":" geoNear_document            "}"
//      / "{" graphLookup       ":" graphLookup_document        "}"
        / "{" group             ":" group_document              "}"
        / "{" indexStats        ":" indexStats_document         "}"
        / "{" limit             ":" positive_integer            "}"
//      / "{" listLocalSessions ":" listLocalSessions_document  "}"
//      / "{" listSessions      ":" listSessions_document       "}"
        / "{" lookup            ":" lookup_document             "}"
        / "{" match             ":" match_document              "}"
        / "{" out               ":" string                      "}" // TODO: check is valid collection?
        / "{" project           ":" project_document            "}"
//      / "{" "$redact"         ":" redact_document             "}"
        / "{" replaceRoot       ":" replaceRoot_document        "}"
        / "{" sample            ":" sample_document             "}"
        / "{" skip              ":" positive_integer            "}"
        / "{" sort              ":" sort_document               "}"
//      / "{" sortByCount       ":" sortByCount_document        "}"
        / "{" unwind            ":" unwind_document             "}"


addFields "$addFields" = '"$addFields"' { return '$addFields' } / "'$addFields'" { return '$addFields' } / "$addFields"
addFields_item = f:field ":" expression
addFields_document = "{" a:addFields_item aArr:("," addFields_item)* ","? "}"
    {
        return objOfArray([a].concat(cleanAndFlatten(aArr)))
    }

// TODO: $bucket, $bucketAuto

collStats "$collStats" = "$collStats" / "'$collStats'" { return '$collStats' } / '"$collStats"' { return '$collStats' }
latencyStats "latencyStats" = "latencyStats" / "'latencyStats'" { return 'latencyStats' } / '"latencyStats"' { return 'latencyStats' }
storageStats "storageStats" = "storageStats" / "'storageStats'" { return 'storageStats' } / '"storageStats"' { return 'storageStats' }
histograms   "histograms"   = "histograms"   / "'histograms'"   { return 'histograms'   } / '"histograms"'   { return 'histograms'   }
collStats_item = lt:latencyStats  ":" "{" h:histograms ":" b:boolean "}"
                { 
                  var obj = {} 
                  obj[lt] = {}, 
                  obj[lt][h] = b 
                  return obj 
                }
               / s:storageStats ":" "{" "}" 
                { 
                  var obj = {} 
                  obj[s] = {} 
                  return obj
                }
collStats_document = "{" ci:collStats_item? cArr:("," collStats_item)* ","? "}"
    {
        return [ci].concat(cleanAndFlatten(cArr))
    }

count "$count" = '"$count"' { return '$count' } / "'$count'" { return '$count' } / "$count"

currentOp "$currentOp" = '"$currentOp"' { return '$currentOp' } / "'$currentOp'" { return '$currentOp' } / "$currentOp"
allUsers "allUsers" = "allUsers" / "'allUsers'" { return 'allUsers' } / '"allUsers"' { return 'allUsers' }
idleConnections "idleConnections" = "idleConnections" / "'idleConnections'" { return 'idleConnections' } / '"idleConnections"' { return 'idleConnections' }
currentOp_item = au:allUsers ":" b:boolean
                {
                  var obj = {}
                  obj[au] = b
                  return obj
                }
               / ic:idleConnections ":" b:boolean
                {
                  var obj = {}
                  obj[ic] = b
                  return obj
                }
currentOp_document = "{" ci:currentOp_item? cArr:("," currentOp_item)* ","? "}"
    {
        return [ci].concat(cleanAndFlatten(cArr))
    }

// TODO: $facet

geoNear "$geoNear" = "$geoNear" / "'$geoNear'" { return '$geoNear' } / '"$geoNear"' { return '$geoNear' }
near "near" = "near" / "'near'" { return 'near' } / '"near"' { return 'near' }
distanceField "distanceField" = "distanceField" / "'distanceField'" { return 'distanceField' } / '"distanceField"' { return 'distanceField' }
spherical "spherical" = "spherical" / "'spherical'" { return 'spherical' } / '"spherical"' { return 'spherical' }
geoLimit "limit" = "limit" / "'limit'" { return 'limit' } / '"limit"' { return 'limit' }
num "num" = "num" / "'num'" { return 'num' } / '"num"' { return 'num' }
query "query" = "query" / "'query'" { return 'query' } / '"query"' { return 'query' }
distanceMultiplier "distanceMultiplier" = "distanceMultiplier" / "'distanceMultiplier'" { return 'distanceMultiplier' } / '"distanceMultiplier"' { return 'distanceMultiplier' }
uniqueDocs "uniqueDocs" = "uniqueDocs" / "'uniqueDocs'" { return 'uniqueDocs' } / '"uniqueDocs"' { return 'uniqueDocs' }
includeLocs "includeLocs" = "includeLocs" / "'includeLocs'" { return 'includeLocs' } / '"includeLocs"' { return 'includeLocs' }
maxDistance "maxDistance" = "maxDistance" / "'maxDistance'" { return 'maxDistance' } / '"maxDistance"' { return 'maxDistance' }
minDistance "minDistance" = "minDistance" / "'minDistance'" { return 'minDistance' } / '"minDistance"' { return 'minDistance' }
type "type" = "type" / "'type'" { return 'type' } / '"type"' { return 'type' }
coordinates "coordinates" = "coordinates" / "'coordinates'" { return 'coordinates' } / '"coordinates"' { return 'coordinates' }
point "Point" = "'Point'" { return 'Point' } / '"Point"' { return 'Point' }
legacy_coordinates = "[" n1:number "," n2:number "]"
near_item = geoJSON_document / legacy_coordinates
geoJSON_item = t:type ":" point
               / c:coordinates ":" "[" n1:number "," n2:number "]"
geoJSON_document = "{" j1:geoJSON_item "," j2:geoJSON_item "}"
    {
        return objOfArray(checkRequiredOperators([j1, j2], ['type', 'coordinates']))
    }
geoNear_item = gn:near ":" gni:near_item
             / gdf:distanceField ":" s:string
             / gs:spherical  ":" b:boolean
             / gl:geoLimit ":" i:positive_integer
             / gn:num ":" i:positive_integer
             / gmd:maxDistance ":" n:number
             / gq:query ":" m:match_document
             / gdm:distanceMultiplier ":" n:number
             / gu:uniqueDocs ":" b:boolean
             / gi:includeLocs ":" s:string
             / gnd:minDistance ":" n:number
geoNear_document ="{" g:geoNear_item gArr:("," geoNear_item)* ","? "}"
    {
        return objOfArray(checkRequiredOperators([g].concat(cleanAndFlatten(gArr)), ['near', 'distanceField']))
    }

// TODO: $graphLookup

group "$group" = '"$group"' { return '$group' } / "'$group'" { return '$group' } / "$group"
group_item = id ":" expression
           / f:field ":" "{" a:accumulator ":" e:expression "}"
            {
                var obj = {}
                obj[a] = e
                return [f, ":", obj]
            }
group_document = "{" g:group_item gArr:("," group_item)* ","? "}"
    {
        return objOfArray(checkRequiredOperators([g].concat(cleanAndFlatten(gArr)), ['_id']))
    }

indexStats "$indexStats" = '"$indexStats"' { return '$indexStats' } / "'$indexStats'" { return '$indexStats' } / "$indexStats"
// TODO: need grammar for all of indexStats, should support top level expressions ($and and $or)
indexStats_document = "{""}"
    {
        return {}
    }

limit "$limit"  = '"$limit"'  { return '$limit' }  / "'$limit'"  { return '$limit'  }  / "$limit"

// TODO: listLocalSessions, listSessions

lookup "$lookup" = '"$lookup"' { return '$lookup' } / "'$lookup'" { return '$lookup' } / "$lookup"
from           "from"         = '"from"' { return 'from' }
                              / "'from'" { return 'from' }
                              / "from"
localField     "localField"   = '"localField"' { return 'localField' }
                              / "'localField'" { return 'localField' }
                              / "localField"
foreignField   "foreignField" = '"foreignField"' { return 'foreignField' }
                              / "'foreignField'" { return 'foreignField' }
                              / "foreignField"
as             "as"           = '"as"' { return 'as' }
                              / "'as'" { return 'as' }
                              / "as"
let_kw         "let"          = '"let"' { return 'let' }
                              / "'let'" { return 'let' }
                              / "let"
pipeline_kw    "pipeline"     = '"pipeline"' { return 'pipeline' }
                              / "'pipeline'" { return 'pipeline' }
                              / "pipeline"
lookup_item =  from           ":" string // TODO: perhaps check this is a valid collection
               / localField   ":" string // For some reason this doesn't need a $
               / foreignField ":" string
               / as           ":" string
               / let_kw       ":" object
               / pipeline_kw  ":" pipeline
lookup_document = "{" l:lookup_item lArr:("," lookup_item)* ","? "}"
    {
        return objOfArray([l].concat(cleanAndFlatten(lArr)))
    }

// Match accepts only query operator syntax and document literals.
match "$match" = '"$match"' { return '$match' } / "'$match'" { return '$match' } / "$match"
match_item = field ":" query_expression
           / and   ":" query_array
           / or    ":" query_array
           / expr  ":" query_expression
match_document = "{" "}"
    {
        return {}
    }
   / "{" s:match_item sArr:("," match_item)* ","? "}"
    {
        return objOfArray([s].concat(cleanAndFlatten(sArr)))
    }

out "out" = '"$out"' { return '$out' } / "'$out'" { return '$out' } / "$out"

project "$project"= '"$project"' { return '$project' } / "'$project'" { return '$project' } / "$project"
project_item =   i:id    ":" e:("0" / "false" / "1" / "true")              { return [i, ':', toBool(e)] }
               / f:field ":" e:("0" / "false" / "1" / "true" / expression) { return [f, ':', toBool(e)] }
// Project actually must have at least one item
project_document  = "{" s:project_item sArr:("," project_item)* ","? "}" 
    {
        return objOfArray(checkExclusivity([s].concat(cleanAndFlatten(sArr))))
    }

// TODO: $redact

replaceRoot "$replaceRoot" = '"$replaceRoot"' { return '$replaceRoot' } / "'$replaceRoot'" { return '$replaceRoot' } / "$replaceRoot"
newRoot "newRoot" = "newRoot" / "'newRoot'" { return 'newRoot' } / '"newRoot"' { return 'newRoot' }
replaceRoot_document ="{" newRoot ":" o:object "}"


sample "$sample" = '"$sample"' { return '$sample' } / "'$sample'" { return '$sample' } / "$sample"
size "size" = "size" / "'size'" { return 'size' } / '"size"' { return 'size' }
sample_document ="{" size ":" i:positive_integer"}"

skip  "$skip"   = '"$skip"'   { return '$skip' }   / "'$skip'"   { return '$skip'   }  / "$skip"

sort "$sort" = '"$sort"' { return '$sort' } / "'$sort'" { return '$sort' } / "$sort"
meta "$meta" = "$meta" / "'$meta'" { return '$meta' } / '"$meta"' { return '$meta' }
textScore "textScore" = "'textScore'" { return 'textScore' } / '"textScore"' { return 'textScore' }
sort_item     = f:field ":" "-1"
              / f:field ":" "1"
              / f:field ":" "{" m:meta ":" t:textScore "}"
                {
                     var obj = {}
                     obj[m] = t
                     return [f, ":", obj]
                }
sort_document = "{" s:sort_item sArr:("," sort_item)* ","? "}"
    {
        return objOfArray([s].concat(cleanAndFlatten(sArr)))
    }

// TODO: $sortByCount

unwind "$unwind"= '"$unwind"' { return '$unwind' } / "'$unwind'" { return '$unwind' }  / "$unwind"
path                       'path'
                           = '"path"' { return 'path' }
                           / "'path'" { return 'path' }
                           / "path"
includeArrayIndex          'includeArrayIndex'
                           = '"includeArrayIndex"' { return 'includeArrayIndex' }
                           / "'includeArrayIndex'" { return 'includeArrayIndex' }
                           / "includeArrayIndex"
preserveNullAndEmptyArrays 'preserveNullAndEmptyArrays'
                           = '"preserveNullAndEmptyArrays"' { return 'preserveNullAndEmptyArrays' }
                           / "'preserveNullAndEmptyArrays'" { return 'preserveNullAndEmptyArrays' }
                           / "preserveNullAndEmptyArrays"
unwind_item =  p:path ":" s:string    { return [p, ':', checkIsFieldPath(s)] }
               / ia:includeArrayIndex ":" s:string { return [ia, ':', checkIsNotFieldPath(s)] }
               / preserveNullAndEmptyArrays ":" boolean
unwind_document = s:string
        { return checkIsFieldPath(s) }
        / "{" u:unwind_item uArr:("," unwind_item)* ","? "}"
    {
        return objOfArray([u].concat(cleanAndFlatten(uArr)))
    }

/////////////////
// expressions //
/////////////////

// TODO: handle field paths, i.e. fields with $ prefixed

accumulator    = sum
               / avg
               / first
               / last
               / max
               / min
               / push
               / addToSet
               / stdDevPop
               / stdDevSamp
sum        "$sum"        = "$sum"        / "'$sum'"        { return '$sum'       } / '"$sum"'       { return '$sum'       }
avg        "$avg"        = "$avg"        / "'$avg'"        { return '$avg'       } / '"$avg"'       { return '$avg'       }
first      "$first"      = "$first"      / "'$first'"      { return '$first'     } / '"$first"'     { return '$first'     }
last       "$last"       = "$last"       / "'$last'"       { return '$last'      } / '"$last"'      { return '$last'      }
max        "$max"        = "$max"        / "'$max'"        { return '$max'       } / '"$max"'       { return '$max'       }
min        "$min"        = "$min"        / "'$min'"        { return '$min'       } / '"$min"'       { return '$min'       }
push       "$push"       = "$push"       / "'$push'"       { return '$push'      } / '"$push"'      { return '$push'      }
addToSet   "$addToSet"   = "$addToSet"   / "'$addToSet'"   { return '$addToSet'  } / '"$addToSet"'  { return '$addToSet'  }
stdDevPop  "$stdDevPop"  = "$stdDevPop"  / "'$stdDevPop'"  { return '$stdDevPop' } / '"$stdDevPop"' { return '$stdDevPop' }
stdDevSamp "$stdDevSamp" = "$stdDevSamp" / "'$stdDevSamp'" { return '$stdDevSamp'} / '"$stdDevSamp"'{ return '$stdDevSamp'}

query_operator = comp_op
                / log_op
                / element_op
                / eval_op
                / geo_op
                / array_op
                / bit_op
                / array_op
                / comment
                / project_op
                / field // TODO: needed?

comp_op  = eq / gte / gt / in / lte / lt / ne / nin
log_op = and / not / nor / or
element_op = exists / typeOp
eval_op = expr / jsonSchema / mod / regex / text / where
geo_op = geoIntersects / geoWithin / nearSphere / nearOp / minDistanceOp / maxDistanceOp / geometry
array_op = all / elemMatch / sizeOp
bit_op = bitsAllClear / bitsAllSet / bitsAnyClear / bitsAnySet
project_op = elemMatch / metaOp / slice  // TODO: $

lte        "$lte"       = "$lte"       / "'$lte'"       { return '$lte'     } / '"$lte"'      { return '$lte'      }
gte        "$gte"       = "$gte"       / "'$gte'"       { return '$gte'     } / '"$gte"'      { return '$gte'      }
eq         "$eq"        = "$eq"        / "'$eq'"        { return '$eq'      } / '"$eq"'       { return '$eq'       }
gt         "$gt"        = "$gt"        / "'$gt'"        { return '$gt'      } / '"$gt"'       { return '$gt'       }
in         "$in"        = "$in"        / "'$in'"        { return '$in'      } / '"$in"'       { return '$in'       }
lt         "$lt"        = "$lt"        / "'$lt'"        { return '$lt'      } / '"$lt"'       { return '$lt'       }
ne         "$ne"        = "$ne"        / "'$ne'"        { return '$ne'      } / '"$ne"'       { return '$ne'       }
nin        "$nin"       = "$nin"       / "'$nin'"       { return '$nin'     } / '"$nin"'      { return '$nin'      }
and        "$and"       = "$and"       / "'$and'"       { return '$and'     } / '"$and"'      { return '$and'      }
or         "$or"        = "$or"        / "'$or'"        { return '$or'      } / '"$or"'       { return '$or'       }
not        "$not"       = "$not"       / "'$not'"       { return '$not'     } / '"$not"'      { return '$not'      }
nor        "$nor"       = "$nor"       / "'$nor'"       { return '$nor'     } / '"$nor"'      { return '$nor'      }
exists     "$exists"    = "$exists"    / "'$exists'"    { return '$exists'  } / '"$exists"'   { return '$exists'   }
typeOp     "$type"      = "$type"      / "'$type'"      { return '$type'    } / '"$type"'     { return '$type'     }
expr       "$expr"      = "$expr"      / "'$expr'"      { return '$expr'    } / '"$expr"'     { return '$expr'     }
mod        "$mod"       = "$mod"       / "'$mod'"       { return '$mod'     } / '"$mod"'      { return '$mod'      }
regex      "$regex"     = "$regex"     / "'$regex'"     { return '$regex'   } / '"$regex"'    { return '$regex'    }
text       "$text"      = "$text"      / "'$text'"      { return '$text'    } / '"$text"'     { return '$text'     }
where      "$where"     = "$where"     / "'$where'"     { return '$where'   } / '"$where"'    { return '$where'    }
nearSphere      "$nearSphere"    = "$nearSphere"    / "'$nearSphere'"    { return '$nearSphere' }    / '"$nearSphere"'    { return '$nearSphere'    }
nearOp     "$near"      = "$near"      / "'$near'"      { return '$near'    } / '"$near"'     { return '$near'     }
all        "$all"       = "$all"       / "'$all'"       { return '$all'     } / '"$all"'      { return '$all'      }
sizeOp     "$size"      = "$size"      / "'$size'"      { return '$size'    } / '"$size"'     { return '$size'     }
metaOp     "$meta"      = "$meta"      / "'$meta'"      { return '$meta'    } / '"$meta"'     { return '$meta'     }
slice      "$slice"     = "$slice"     / "'$slice'"     { return '$slice'   } / '"$slice"'    { return '$slice'    }
comment    "$comment"   = "$comment"   / "'$comment'"   { return '$comment' } / '"$comment"'  { return '$comment'  }
jsonSchema      "$jsonSchema"    = "$jsonSchema"    / "'$jsonSchema'"    { return '$jsonSchema' }    / '"$jsonSchema"'    { return '$jsonSchema'    }
elemMatch       "$elemMatch"     = "$elemMatch"     / "'$elemMatch'"     { return '$elemMatch' }     / '"$elemMatch"'     { return '$elemMatch'     }
geoIntersects   "$geoIntersects" = "$geoIntersects" / "'$geoIntersects'" { return '$geoIntersects' } / '"$geoIntersects"' { return '$geoIntersects' }
geoWithin       "$geoWithin"     = "$geoWithin"     / "'$geoWithin'"     { return '$geoWithin' }     / '"$geoWithin"'     { return '$geoWithin'     }
geometry        "$geometry"      = "$geometry"      / "'$geometry'"      { return '$geometry' }      / '"$geometry"'      { return '$geometry'      }
minDistanceOp   "$minDistance"   = "$minDistance"   / "'$minDistance'"   { return '$minDistance' }   / '"$minDistance"'   { return '$minDistance'   }
maxDistanceOp   "$maxDistance"   = "$maxDistance"   / "'$maxDistance'"   { return '$maxDistance' }   / '"$maxDistance"'   { return '$maxDistance'   }
bitsAllSet      "$bitsAllSet"    = "$bitsAllSet"    / "'$bitsAllSet'"    { return '$bitsAllSet' }    / '"$bitsAllSet"'    { return '$bitsAllSet'    }
bitsAnySet      "$bitsAnySet"    = "$bitsAnySet"    / "'$bitsAnySet'"    { return '$bitsAnySet' }    / '"$bitsAnySet"'    { return '$bitsAnySet'    }
bitsAllClear    "$bitsAllClear"  = "$bitsAllClear"  / "'$bitsAllClear'"  { return '$bitsAllClear' }  / '"$bitsAllClear"'  { return '$bitsAllClear'  }
bitsAnyClear    "$bitsAnyClear"  = "$bitsAnyClear"  / "'$bitsAnyClear'"  { return '$bitsAnyClear' }  / '"$bitsAnyClear"'  { return '$bitsAnyClear'  }


// A few contexts allow only id.  Note that a context requiring id must come before field
// in alternatives because field will also match id.  PEGs process alternatives in left to right
// order, unlike context-free grammars, so this works.
id "_id" = '_id' / "'_id'" { return '_id' } / '"_id"' { return '_id' }

// TODO: Need to expand what can be an expression, need to add dates and whatnot
// (though these could just be checked in AST) let/map/functions/etc 
expression = number / string / boolean / null / array / object
// Expression that can include query operators
query_expression = e:expression / e:query_object / e:query_array {console.log(e)}

// This is odd, but there's no other good way to allow for the optional trailing comma
/* Document literals */
array  "Array" = "[""]"
                 { return [] }
               / "[" e:expression eArr:("," expression)* ","? "]"
                 { return [e].concat(cleanAndFlatten(eArr)) }

object "Object" = "{""}"
                 { return {} }
                / "{" oi:object_item oiArr:("," object_item)* ","? "}" 
                 { 
                   return objOfArray([oi].concat(cleanAndFlatten(oiArr))) 
                 }
object_item = f:field ":" e:expression

/* Any query expression */
query_array  "QueryArray" = "[""]"
                 { return [] }
               / "[" e:expression eArr:("," expression)* ","? "]"
               / "[" e:query_expression eArr:("," query_expression)* ","? "]"
                 {
                    return [e].concat(cleanAndFlatten(eArr))
                 }
query_object "QueryObject" = "{""}"
                 { return {} }
                / "{" oi:object_item oiArr:("," object_item)* ","? "}"
                / "{" oi:query_object_item oiArr:("," query_object_item)* ","? "}"
                 {
                   return objOfArray([oi].concat(cleanAndFlatten(oiArr)))
                 }
query_object_item = f:query_operator ":" e:query_expression

field "Field Name" // TODO: better grammar for field names
  = f:[_A-Za-z] s:([_A-Za-z0-9]*) { return f + s.join("") }
  / string

string "String"
  = ["] str:(([^"\\] / "\\" . )*) ["] { return str.map(cleanBackSlashes).join("") } 
  / ['] str:(([^'\\] / "\\" . )*) ['] { return str.map(cleanBackSlashes).join("") }


// Float must come before integer or integer will be matched when floats occur
number "Number" = "-"? digits:[0-9]+ '.' fraction:[0-9]* { return parseFloat(digits.join("") + '.' + fraction.join("")) }
       / integer

integer "Integer" = positive_integer / "-" i:positive_integer { return -1 * i }

positive_integer "Positive Integer"                                  
  = digits:[0-9]+ { return parseInt(digits.join(""), 10)  }
                                                         
boolean 
  = "true" {return true} / "false" {return false} 

null = "null" {return null}
                                                         
                                                         
                                                         
