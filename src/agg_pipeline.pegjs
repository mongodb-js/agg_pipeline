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
        if (e === '0') {
            return 0
        } else if(e === 'false') {
            return false
        } else if (e === '1') {
            return 1
        } else if (e === 'true') {
            return true
        }
        return e
   }
   // make sure that $project is either all inclusive or all exclusive
   // we perform this on the initial array before changing to an object
   // because it's easier for me to just use filter
   function checkExclusivity(arr) {
        var exclusive = arr.filter(el => el[0] !== '_id' && !el[2])
        var inclusive = arr.filter(el => el[2])
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
   // check that the field does not start with '$' or .
   function checkIsNotFieldPath(s) {
        if (s.charAt(0) !== '$' && s.charAt(0) !== '.') {
            return s;
        }
        error("Field cannot begin with '$' or '.', field was: " + s, location())
   }

   function cleanBackSlashes(ch) {
        if (ch instanceof Array) {
                return ch.join("")
        }
        return ch
   }
   function checkNotOperator(s) {
        if (s.charAt(0) === '$') {
            error("Field must not begin with '$' or '.', field path was: " + s, location())
        }
        if(s.charAt(0) === '.') {
            error("Field must not begin with '$' or '.', field path was: " + s, location())
        }
        return s;
   }
}

// We can have just one stage in an aggregation, or we can have an actual pipeline (array)
start   =      st:stage                                          
               {
                      return st
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

stage_syntax "AggregationStage" =
          "{" addFields         ":" addFields_document          "}"
        / "{" bucket            ":" bucket_document             "}"
        / "{" bucketAuto        ":" bucketAuto_document         "}"
        / "{" collStats         ":" collStats_document          "}"
        / "{" count             ":" string                      "}"
        / "{" currentOp         ":" currentOp_document          "}"
        / "{" facet             ":" facet_document              "}"
        / "{" geoNear           ":" geoNear_document            "}"
        / "{" graphLookup       ":" graphLookup_document        "}"
        / "{" group             ":" group_document              "}"
        / "{" indexStats        ":" indexStats_document         "}"
        / "{" limit             ":" positive_integer            "}"
        / "{" listLocalSessions ":" listLocalSessions_document  "}"
        / "{" listSessions      ":" listLocalSessions_document  "}"
        / "{" lookup            ":" lookup_document             "}"
        / "{" match             ":" match_document              "}"
        / "{" out               ":" string                      "}" // TODO: check is valid collection?
        / "{" project           ":" project_document            "}"
        / "{" redact            ":" redact_document             "}"
        / "{" replaceRoot       ":" replaceRoot_document        "}"
        / "{" sample            ":" sample_document             "}"
        / "{" skip              ":" positive_integer            "}"
        / "{" sort              ":" sort_document               "}"
        / "{" sortByCount       ":" sortByCount_document        "}"
        / "{" unwind            ":" unwind_document             "}"


addFields "$addFields" = '"$addFields"' { return '$addFields' } / "'$addFields'" { return '$addFields' } / "$addFields"
addFields_item = f:field ":" agg_expression
addFields_document = "{" a:addFields_item aArr:("," addFields_item)* ","? "}"
    {
        return objOfArray([a].concat(cleanAndFlatten(aArr)))
    }

bucket "$bucket" = "$bucket" / "'$bucket'" { return '$bucket' } / '"$bucket"' { return '$bucket' }
groupBy "groupBy" = "groupBy" / "'groupBy'" { return 'groupBy' } / '"groupBy"' { return 'groupBy' }
boundaries "boundaries" = "boundaries" / "'boundaries'" { return 'boundaries' } / '"boundaries"' { return 'boundaries' }
default "default" = "default" / "'default'" { return 'default' } / '"default"' { return 'default' }
output "output" = "output" / "'output'" { return 'output' } / '"output"' { return 'output' }

output_item = f:field ":" "{" a:accumulator ":" e:agg_expression "}"
     {
        var obj = {}
        obj[a] = e
        return [f, ":", obj]
     }
output_doc = "{" g:output_item gArr:("," output_item)* ","? "}"
    {
        return objOfArray([g].concat(cleanAndFlatten(gArr)))
    }
bucket_item = groupBy ":" agg_expression
            / boundaries ":" a:agg_array
            / default ":" l:literal
            / output ":" output_doc
bucket_document ="{" g:bucket_item gArr:("," bucket_item)* ","? "}"
    {
        return objOfArray(checkRequiredOperators([g].concat(cleanAndFlatten(gArr)), ['groupBy', 'boundaries']))
    }

bucketAuto "$bucketAuto" = "$bucketAuto" / "'$bucketAuto'" { return '$bucketAuto' } / '"$bucketAuto"' { return '$bucketAuto' }
buckets "buckets" = "buckets" / "'buckets'" { return 'buckets' } / '"buckets"' { return 'buckets' }
granularity "granularity" = "granularity" / "'granularity'" { return 'granularity' } / '"granularity"' { return 'granularity' }
bucketAuto_item = groupBy ":" agg_expression
                / output ":" output_doc
                / buckets ":" number
                / granularity ":" string
bucketAuto_document ="{" g:bucketAuto_item gArr:("," bucketAuto_item)* ","? "}"
    {
        return objOfArray(checkRequiredOperators([g].concat(cleanAndFlatten(gArr)), ['groupBy', 'buckets']))
    }

collStats "$collStats" = "$collStats" / "'$collStats'" { return '$collStats' } / '"$collStats"' { return '$collStats' }
latencyStats "latencyStats" = "latencyStats" / "'latencyStats'" { return 'latencyStats' } / '"latencyStats"' { return 'latencyStats' }
storageStats "storageStats" = "storageStats" / "'storageStats'" { return 'storageStats' } / '"storageStats"' { return 'storageStats' }
histograms   "histograms"   = "histograms"   / "'histograms'"   { return 'histograms'   } / '"histograms"'   { return 'histograms'   }
collStats_item = lt:latencyStats  ":" "{" h:histograms ":" b:boolean "}"
                { 
                  var obj = {} 
                  obj[h] = b
                  return [lt, ":", obj]
                }
               / s:storageStats ":" "{" "}" 
                { 
                  return [s, ":", {}]
                }
               / c:( "count" / "'count'" { return 'count' } / '"count"' { return 'count' } ) ":" "{" "}"
                {
                  return [c, ":", {}]
                }

collStats_document = "{" "}"
                {
                  return {}
                }
                / "{" ci:collStats_item cArr:("," collStats_item)* ","? "}"
                {
                    return objOfArray([ci].concat(cleanAndFlatten(cArr)))
                }

count "$count" = '"$count"' { return '$count' } / "'$count'" { return '$count' } / "$count"

currentOp "$currentOp" = '"$currentOp"' { return '$currentOp' } / "'$currentOp'" { return '$currentOp' } / "$currentOp"
allUsers "allUsers" = "allUsers" / "'allUsers'" { return 'allUsers' } / '"allUsers"' { return 'allUsers' }
idleConnections "idleConnections" = "idleConnections" / "'idleConnections'" { return 'idleConnections' } / '"idleConnections"' { return 'idleConnections' }
currentOp_item = au:allUsers ":" b:boolean
                {
                  return [au, ":", b]
                }
               / ic:idleConnections ":" b:boolean
                {
                  return [ic, ":", b]
                }
currentOp_document = "{" "}"
                {
                  return {}
                }
                / "{" ci:currentOp_item cArr:("," currentOp_item)* ","? "}"
                {
                    return objOfArray([ci].concat(cleanAndFlatten(cArr)))
                }

facet "$facet" = "$facet" / "'$facet'" { return '$facet' } / '"$facet"' { return '$facet' }
facet_item = f:field ":" pipeline
facet_document = "{" a:facet_item aArr:("," facet_item)* ","? "}"
    {
        return objOfArray([a].concat(cleanAndFlatten(aArr)))
    }

geoNear "$geoNear" = "$geoNear" / "'$geoNear'" { return '$geoNear' } / '"$geoNear"' { return '$geoNear' }
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
                      { return [n1, n2] }
near_item = geoJSON_document / legacy_coordinates
geoJSON_item = t:type ":" point
               / c:coordinates ":" "[" n1:number "," n2:number "]"
                { return [c, ":", [n1, n2]] }
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
             / gq:query ":" m:query_expression
             / gdm:distanceMultiplier ":" n:number
             / gu:uniqueDocs ":" b:boolean
             / gi:includeLocs ":" s:string
             / gnd:minDistance ":" n:number
geoNear_document ="{" g:geoNear_item gArr:("," geoNear_item)* ","? "}"
    {
        return objOfArray(checkRequiredOperators([g].concat(cleanAndFlatten(gArr)), ['near', 'distanceField']))
    }

graphLookup "$graphLookup" = '"$graphLookup"' { return '$graphLookup' } / "'$graphLookup'" { return '$graphLookup' } / "$graphLookup"
startWith "startWith" = '"startWith"' { return 'startWith' } / "'startWith'" { return 'startWith' } / "startWith"
connectFromField "connectFromField" = '"connectFromField"' { return 'connectFromField' } / "'connectFromField'" { return 'connectFromField' } / "connectFromField"
connectToField "connectToField" = '"connectToField"' { return 'connectToField' } / "'connectToField'" { return 'connectToField' } / "connectToField"
maxDepth "maxDepth" = '"maxDepth"' { return 'maxDepth' } / "'maxDepth'" { return 'maxDepth' } / "maxDepth"
depthField "depthField" = '"depthField"' { return 'depthField' } / "'depthField'" { return 'depthField' } / "depthField"
restrictSearchWithMatch "restrictSearchWithMatch" = '"restrictSearchWithMatch"' { return 'restrictSearchWithMatch' } / "'restrictSearchWithMatch'" { return 'restrictSearchWithMatch' } / "restrictSearchWithMatch"
connectToField_item = s:string / a:array
graphLookup_item = from ":" s:string
                 / startWith ":" agg_expression
                 / connectFromField ":" s:string
                 / connectToField ":" connectToField_item
                 / as ":" s:string
                 / maxDepth ":" positive_integer
                 / depthField ":" s:string
                 / restrictSearchWithMatch ":" query_object
graphLookup_document = "{" g:graphLookup_item gArr:("," graphLookup_item)* ","? "}"
    {
        return objOfArray(checkRequiredOperators([g].concat(cleanAndFlatten(gArr)), ['from', 'startWith', 'connectFromField', 'connectToField', 'as']))
    }

group "$group" = '"$group"' { return '$group' } / "'$group'" { return '$group' } / "$group"
group_item = id ":" agg_expression
           / f:field ":" "{" a:accumulator ":" e:agg_expression "}"
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
indexStats_document = "{""}"
    {
        return {}
    }

limit "$limit"  = '"$limit"'  { return '$limit' }  / "'$limit'"  { return '$limit'  }  / "$limit"

listSessions "$listSessions"  = '"$listSessions"'  { return '$listSessions' }  / "'$listSessions'"  { return '$listSessions'  }  / "$listSessions"
listLocalSessions "$listLocalSessions"  = '"$listLocalSessions"'  { return '$listLocalSessions' }  / "'$listLocalSessions'"  { return '$listLocalSessions'  }  / "$listLocalSessions"
users "users"  = '"users"'  { return 'users' }  / "'users'"  { return 'users'  }  / "users"
user "user"  = '"user"'  { return 'user' }  / "'user'"  { return 'user'  }  / "user"
db "db"  = '"db"'  { return 'db' }  / "'db'"  { return 'db'  }  / "db"

users_item = u:user ":" s:string
           / d:db ":" s:string
users_document = "{" u1:users_item "," u2:users_item "}"
                {
                  return objOfArray(checkRequiredOperators([u1, u2], ['user', 'db']))
                }
users_array = "[" s:users_document sArr:("," users_document)* ","? "]"
                {
                    return [s].concat(cleanAndFlatten(sArr))
                }


listLocalSessions_document = "{" "}"
    {
        return {}
    }
   / "{" a:allUsers ":" "true" "}"
    {
      const obj = {};
      obj[a] = true;
      return obj
    }
   / "{" f:users ":" u:users_array "}"
    {
      const obj = {};
      obj[f] = u;
      return obj
    }


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
match_item = and   ":" query_array
           / or    ":" query_array
           / expr  ":" query_expression
           / field ":" query_expression
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
               / f:field ":" e:("0" / "false" / "1" / "true" / agg_expression) { return [f, ':', toBool(e)] }
// Project actually must have at least one item
project_document  = "{" s:project_item sArr:("," project_item)* ","? "}" 
    {
        return objOfArray(checkExclusivity([s].concat(cleanAndFlatten(sArr))))
    }

redact "$redact" = '"$redact"' { return '$redact' } / "'$redact'" { return '$redact' } / "$redact"
KEEP "$$KEEP" = '"$$KEEP"' { return '$$KEEP' } / "'$$KEEP'" { return '$$KEEP' }
PRUNE "$$PRUNE" = '"$$PRUNE"' { return '$$PRUNE' } / "'$$PRUNE'" { return '$$PRUNE' }
DESCEND "$$DESCEND" = '"$$DESCEND"' { return '$$DESCEND' } / "'$$DESCEND'" { return '$$DESCEND' }
redact_document = agg_object / KEEP / PRUNE / DESCEND

replaceRoot "$replaceRoot" = '"$replaceRoot"' { return '$replaceRoot' } / "'$replaceRoot'" { return '$replaceRoot' } / "$replaceRoot"
newRoot "newRoot" = "newRoot" / "'newRoot'" { return 'newRoot' } / '"newRoot"' { return 'newRoot' }
replaceRoot_document ="{" n:newRoot ":" o:agg_object "}"
                {
                  var obj = {}
                  obj[n] = o
                  return obj
                }


sample "$sample" = '"$sample"' { return '$sample' } / "'$sample'" { return '$sample' } / "$sample"
size "size" = "size" / "'size'" { return 'size' } / '"size"' { return 'size' }
sample_document ="{" s:size ":" i:positive_integer"}"
                {
                  var obj = {}
                  obj[s] = i
                  return obj
                }

skip  "$skip"   = '"$skip"'   { return '$skip' }   / "'$skip'"   { return '$skip'   }  / "$skip"

sort "$sort" = '"$sort"' { return '$sort' } / "'$sort'" { return '$sort' } / "$sort"
textScore "textScore" = "'textScore'" { return 'textScore' } / '"textScore"' { return 'textScore' }
sort_item     = f:field ":" "-1" { return [f, ":", -1] }
              / f:field ":" "1" { return [f, ":", 1] }
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

sortByCount "$sortByCount" = '"$sortByCount"' { return '$sortByCount' } / "'$sortByCount'" { return '$sortByCount' }  / "$sortByCount"
sbc_object_item = agg_operator ":" agg_expression
sbc_object "AggObject" = "{" oi:sbc_object_item oiArr:("," sbc_object_item)* ","? "}"
                 {
                   return objOfArray([oi].concat(cleanAndFlatten(oiArr)))
                 }
sortByCount_document = s:string { return checkIsFieldPath(s) } / sbc_object

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
// EXPRESSIONS //
/////////////////

accumulator "AccumulatorOperator" = sum
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
max        "$max"        = (!"$maxDistance" "$max")             / (!"'$maxDistance'" "'$max'")              { return '$max' } / (!'"$maxDistance"' '"$max"')              { return '$max' }
min        "$min"        = (!"$minute" !"$minDistance" "$min")  / (!"'$minute'" !"'$minDistance'" "'$min'") { return '$min' } / (!'"$minute"' !'"$minDistance"' '"$min"') { return '$min' }
push       "$push"       = "$push"       / "'$push'"       { return '$push'      } / '"$push"'      { return '$push'      }
addToSet   "$addToSet"   = "$addToSet"   / "'$addToSet'"   { return '$addToSet'  } / '"$addToSet"'  { return '$addToSet'  }
stdDevPop  "$stdDevPop"  = "$stdDevPop"  / "'$stdDevPop'"  { return '$stdDevPop' } / '"$stdDevPop"' { return '$stdDevPop' }
stdDevSamp "$stdDevSamp" = "$stdDevSamp" / "'$stdDevSamp'" { return '$stdDevSamp'} / '"$stdDevSamp"'{ return '$stdDevSamp'}

query_operator "QueryOperator" = comp_op
                / log_op
                / element_op
                / eval_op
                / geo_op
                / array_op
                / bit_op
                / array_op
                / comment
                / project_op
                / field

comp_op  = eq / gte / gt / in / lte / lt / ne / nin
log_op = and / not / nor / or
element_op = exists / typeOp
eval_op = expr / jsonSchema / mod / regex / text / where
geo_op = geoIntersects / geoWithin / nearSphere / nearOp / minDistanceOp / maxDistanceOp / geometry
array_op = all / elemMatch / sizeOp
bit_op = bitsAllClear / bitsAllSet / bitsAnyClear / bitsAnySet
project_op = elemMatch / meta / slice

lte        "$lte"       = "$lte"       / "'$lte'"       { return '$lte'     } / '"$lte"'      { return '$lte'      }
gte        "$gte"       = "$gte"       / "'$gte'"       { return '$gte'     } / '"$gte"'      { return '$gte'      }
eq         "$eq"        = "$eq"        / "'$eq'"        { return '$eq'      } / '"$eq"'       { return '$eq'       }
gt         "$gt"        = "$gt"        / "'$gt'"        { return '$gt'      } / '"$gt"'       { return '$gt'       }
in         "$in"        = (!"$index" "$in") / (!"'$index" "'$in'")   { return '$in'      } / (!'"$index' '"$in"')       { return '$in'       }
lt         "$lt"        = "$lt"        / "'$lt'"        { return '$lt'      } / '"$lt"'       { return '$lt'       }
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
all        "$all"       = (!"$allElementsTrue" "$all")  / (!"'$allElementsTrue" "'$all'")     { return '$all'      } / (!'"$allElementsTrue' '"$all"') { return '$all'      }
meta       "$meta"      = "$meta"      / "'$meta'"      { return '$meta'    } / '"$meta"'     { return '$meta'     }
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

/* Mess */
nearSphere "$nearSphere"    = "$nearSphere"                      / "'$nearSphere'"                          { return '$nearSphere' }    / '"$nearSphere"'                           { return '$nearSphere'  }
nearOp     "$near"          = (!"$nearSphere" "$near")           / (!"nearSphere" "'$near'")                { return '$near'    }       / (!'"$nearSphere"' '"$near"')              { return '$near'        }
ne         "$ne"            = (!"$near" "$ne")                   / (!"'$near" "'$ne'")                      { return '$ne'      }       / (!'"$near' '"$ne"')                       { return '$ne'          }
near       "near"           = !"$near" !"$nearSphere" n:"near" { return n }   / !"'$near'" !"'$nearSphere'" "'near'" { return 'near'     }     / !'"$near"' !'"$nearSphere"' '"near"'   { return 'near'         }

sizeOp     "$size"      = "$size"      / "'$size'"      { return '$size'    } / '"$size"'     { return '$size'     }

agg_operator "AggregationOperator" = accumulator
             / and / eq / gte / gt / lte / lt / in / meta / mod / ne / not / or
             / sizeOp / slice / typeOp / abs / add / allElementsTrue / anyElementTrue
             / arrayElemAt / arrayToObject / ceil / cmp / concatArrays / concat / cond
             / dateFromParts / dateFromString / dateToString / dateToParts
             / dayOfMonth / dayOfWeek / dayOfYear / divide / exp / filter
             / floor / hour / ifNull / indexOfBytes / indexOfCP / indexOfArray
             / isArray / isoDayOfWeek / isoWeekYear / isoWeek / let / literalOp
             / ln / log10 / log / map / mergeObjects / millisecond / minute
             / month / multiply / objectToArray / pow / range / reduce
             / reverseArray / second / setDifference / setEquals / setIntersection
             / setIsSubset / setUnion / split / sqrt / strcasecmp / strLenBytes
             / strLenCP / substrBytes / substrCP / substr / subtract / switch
             / toLower / toUpper / trunc / week / year / zip / accumulator

abs                     "$abs"              = "$abs"             / "'$abs'" { return '$abs' }                           / '"$abs"' { return '$abs' }
add                     "$add"              = (!"$addToField" !"addToSet" "$add") / (!"'$addTofield'" !"'$addToSet'" "'$add'") { return '$add' } / (!'"$addToField"' !'"$addToSet"' '"$add"') { return '$add' }
allElementsTrue         "$allElementsTrue"  = "$allElementsTrue" / "'$allElementsTrue'" { return '$allElementsTrue' }   / '"$allElementsTrue"' { return '$allElementsTrue' }
anyElementTrue          "$anyElementTrue"   = "$anyElementTrue"  / "'$anyElementTrue'" { return '$anyElementTrue' }     / '"$anyElementTrue"' { return '$anyElementTrue' }
arrayElemAt             "$arrayElemAt"      = "$arrayElemAt"     / "'$arrayElemAt'" { return '$arrayElemAt' }           / '"$arrayElemAt"' { return '$arrayElemAt' }
arrayToObject           "$arrayToObject"    = "$arrayToObject"   / "'$arrayToObject'" { return '$arrayToObject' }       / '"$arrayToObject"' { return '$arrayToObject' }
ceil                    "$ceil"             = "$ceil"            / "'$ceil'" { return '$ceil' }                         / '"$ceil"' { return '$ceil' }
cmp                     "$cmp"              = "$cmp"             / "'$cmp'" { return '$cmp' }                           / '"$cmp"' { return '$cmp' }
concatArrays            "$concatArrays"     = "$concatArrays"    / "'$concatArrays'" { return '$concatArrays' }         / '"$concatArrays"' { return '$concatArrays' }
concat                  "$concat"           = (!"$concatArrays" "$concat") / (!"'$concatArrays'" "'$concat'") { return '$concat' } / (!'"$concatArrays"' '"$concat"') { return '$concat' }
cond                    "$cond"             = "$cond"            / "'$cond'" { return '$cond' }                         / '"$cond"' { return '$cond' }
dateFromParts           "$dateFromParts"    = "$dateFromParts"   / "'$dateFromParts'" { return '$dateFromParts' }       / '"$dateFromParts"' { return '$dateFromParts' }
dateFromString          "$dateFromString"   = "$dateFromString"  / "'$dateFromString'" { return '$dateFromString' }     / '"$dateFromString"' { return '$dateFromString' }
dateToString            "$dateToString"     = "$dateToString"    / "'$dateToString'" { return '$dateToString' }         / '"$dateToString"' { return '$dateToString' }
dateToParts             "$dateToParts"      = "$dateToParts"     / "'$dateToParts'" { return '$dateToParts' }           / '"$dateToParts"' { return '$dateToParts' }
dayOfMonth              "$dayOfMonth"       = "$dayOfMonth"      / "'$dayOfMonth'" { return '$dayOfMonth' }             / '"$dayOfMonth"' { return '$dayOfMonth' }
dayOfWeek               "$dayOfWeek"        = "$dayOfWeek"       / "'$dayOfWeek'" { return '$dayOfWeek' }               / '"$dayOfWeek"' { return '$dayOfWeek' }
dayOfYear               "$dayOfYear"        = "$dayOfYear"       / "'$dayOfYear'" { return '$dayOfYear' }               / '"$dayOfYear"' { return '$dayOfYear' }
divide                  "$divide"           = "$divide"          / "'$divide'" { return '$divide' }                     / '"$divide"' { return '$divide' }
exp                     "$exp"              = (!"$expr" "$exp")  / (!"'$expr'" "'$exp'") { return '$exp' }              / (!'"$expr"' '"$exp"') { return '$exp' }
filter                  "$filter"           = "$filter"          / "'$filter'" { return '$filter' }                     / '"$filter"' { return '$filter' }
floor                   "$floor"            = "$floor"           / "'$floor'" { return '$floor' }                       / '"$floor"' { return '$floor' }
hour                    "$hour"             = "$hour"            / "'$hour'" { return '$hour' }                         / '"$hour"' { return '$hour' }
ifNull                  "$ifNull"           = "$ifNull"          / "'$ifNull'" { return '$ifNull' }                     / '"$ifNull"' { return '$ifNull' }
indexOfArray            "$indexOfArray"     = "$indexOfArray"    / "'$indexOfArray'" { return '$indexOfArray' }         / '"$indexOfArray"' { return '$indexOfArray' }
indexOfBytes            "$indexOfBytes"     = "$indexOfBytes"    / "'$indexOfBytes'" { return '$indexOfBytes' }         / '"$indexOfBytes"' { return '$indexOfBytes' }
indexOfCP               "$indexOfCP"        = "$indexOfCP"       / "'$indexOfCP'" { return '$indexOfCP' }               / '"$indexOfCP"' { return '$indexOfCP' }
isArray                 "$isArray"          = "$isArray"         / "'$isArray'" { return '$isArray' }                   / '"$isArray"' { return '$isArray' }
isoDayOfWeek            "$isoDayOfWeek"     = "$isoDayOfWeek"    / "'$isoDayOfWeek'" { return '$isoDayOfWeek' }         / '"$isoDayOfWeek"' { return '$isoDayOfWeek' }
isoWeekYear             "$isoWeekYear"      = "$isoWeekYear"     / "'$isoWeekYear'" { return '$isoWeekYear' }           / '"$isoWeekYear"' { return '$isoWeekYear' }
isoWeek                 "$isoWeek"          = (!"isoWeekYear" "$isoWeek") / (!"'isoWeekYear'" "'$isoWeek'") { return '$isoWeek' } / (!'"$isoWeekYear"' '"$isoWeek"') { return '$isoWeek' }
let                     "$let"              = "$let"             / "'$let'" { return '$let' }                           / '"$let"' { return '$let' }
literalOp               "$literal"          = "$literal"         / "'$literal'" { return '$literal' }                   / '"$literal"' { return '$literal' }
ln                      "$ln"               = "$ln"              / "'$ln'" { return '$ln' }                             / '"$ln"' { return '$ln' }
log10                   "$log10"            = "$log10"           / "'$log10'" { return '$log10' }                       / '"$log10"' { return '$log10' }
log                     "$log"              = (!"$log10" "$log") / (!"'$log10'" "'$log'") { return '$log' }             / (!'"$log10"' '"$log"') { return '$log' }
map                     "$map"              = "$map"             / "'$map'" { return '$map' }                           / '"$map"' { return '$map' }
mergeObjects            "$mergeObjects"     = "$mergeObjects"    / "'$mergeObjects'" { return '$mergeObjects' }         / '"$mergeObjects"' { return '$mergeObjects' }
millisecond             "$millisecond"      = "$millisecond"     / "'$millisecond'" { return '$millisecond' }           / '"$millisecond"' { return '$millisecond' }
minute                  "$minute"           = "$minute"          / "'$minute'" { return '$minute' }                     / '"$minute"' { return '$minute' }
month                   "$month"            = "$month"           / "'$month'" { return '$month' }                       / '"$month"' { return '$month' }
multiply                "$multiply"         = "$multiply"        / "'$multiply'" { return '$multiply' }                 / '"$multiply"' { return '$multiply' }
objectToArray           "$objectToArray"    = "$objectToArray"   / "'$objectToArray'" { return '$objectToArray' }       / '"$objectToArray"' { return '$objectToArray' }
pow                     "$pow"              = "$pow"             / "'$pow'" { return '$pow' }                           / '"$pow"' { return '$pow' }
range                   "$range"            = "$range"           / "'$range'" { return '$range' }                       / '"$range"' { return '$range' }
reduce                  "$reduce"           = "$reduce"          / "'$reduce'" { return '$reduce' }                     / '"$reduce"' { return '$reduce' }
reverseArray            "$reverseArray"     = "$reverseArray"    / "'$reverseArray'" { return '$reverseArray' }         / '"$reverseArray"' { return '$reverseArray' }
second                  "$second"           = "$second"          / "'$second'" { return '$second' }                     / '"$second"' { return '$second' }
setDifference           "$setDifference"    = "$setDifference"   / "'$setDifference'" { return '$setDifference' }       / '"$setDifference"' { return '$setDifference' }
setEquals               "$setEquals"        = "$setEquals"       / "'$setEquals'" { return '$setEquals' }               / '"$setEquals"' { return '$setEquals' }
setIntersection         "$setIntersection"  = "$setIntersection" / "'$setIntersection'" { return '$setIntersection' }   / '"$setIntersection"' { return '$setIntersection' }
setIsSubset             "$setIsSubset"      = "$setIsSubset"     / "'$setIsSubset'" { return '$setIsSubset' }           / '"$setIsSubset"' { return '$setIsSubset' }
setUnion                "$setUnion"         = "$setUnion"        / "'$setUnion'" { return '$setUnion' }                 / '"$setUnion"' { return '$setUnion' }
split                   "$split"            = "$split"           / "'$split'" { return '$split' }                       / '"$split"' { return '$split' }
sqrt                    "$sqrt"             = "$sqrt"            / "'$sqrt'" { return '$sqrt' }                         / '"$sqrt"' { return '$sqrt' }
strcasecmp              "$strcasecmp"       = "$strcasecmp"      / "'$strcasecmp'" { return '$strcasecmp' }             / '"$strcasecmp"' { return '$strcasecmp' }
strLenBytes             "$strLenBytes"      = "$strLenBytes"     / "'$strLenBytes'" { return '$strLenBytes' }           / '"$strLenBytes"' { return '$strLenBytes' }
strLenCP                "$strLenCP"         = "$strLenCP"        / "'$strLenCP'" { return '$strLenCP' }                 / '"$strLenCP"' { return '$strLenCP' }
substrBytes             "$substrBytes"      = "$substrBytes"     / "'$substrBytes'" { return '$substrBytes' }           / '"$substrBytes"' { return '$substrBytes' }
substrCP                "$substrCP"         = "$substrCP"        / "'$substrCP'" { return '$substrCP' }                 / '"$substrCP"' { return '$substrCP' }
substr                  "$substr"           = "$substr"          / "'$substr'" { return '$substr' }                     / '"$substr"' { return '$substr' }
subtract                "$subtract"         = "$subtract"        / "'$subtract'" { return '$subtract' }                 / '"$subtract"' { return '$subtract' }
switch                  "$switch"           = "$switch"          / "'$switch'" { return '$switch' }                     / '"$switch"' { return '$switch' }
toLower                 "$toLower"          = "$toLower"         / "'$toLower'" { return '$toLower' }                   / '"$toLower"' { return '$toLower' }
toUpper                 "$toUpper"          = "$toUpper"         / "'$toUpper'" { return '$toUpper' }                   / '"$toUpper"' { return '$toUpper' }
trunc                   "$trunc"            = "$trunc"           / "'$trunc'" { return '$trunc' }                       / '"$trunc"' { return '$trunc' }
week                    "$week"             = "$week"            / "'$week'" { return '$week' }                         / '"$week"' { return '$week' }
year                    "$year"             = "$year"            / "'$year'" { return '$year' }                         / '"$year"' { return '$year' }
zip                     "$zip"              = "$zip"             / "'$zip'" { return '$zip' }                           / '"$zip"' { return '$zip' }


// A few contexts allow only id.  Note that a context requiring id must come before field
// in alternatives because field will also match id.  PEGs process alternatives in left to right
// order, unlike context-free grammars, so this works.
id "_id" = '_id' / "'_id'" { return '_id' } / '"_id"' { return '_id' }

// TODO: Need to expand what can be an expression, need to add dates and whatnot
// (though these could just be checked in AST) let/map/functions/etc 
expression = bson_types / number / string / boolean / null / array / object

// Expression that can include query operators
query_expression = query_object / query_array / expression

// Expression that can include aggregation operators
agg_expression = agg_object / agg_array / expression

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
query_object_item = f:query_operator ":" e:query_expression
query_array  "QueryArrayExpr" = "[""]"
                 { return [] }
               / "[" e:query_expression eArr:("," query_expression)* ","? "]"
                {
                  return [e].concat(cleanAndFlatten(eArr))
                }
               / "[" e:expression eArr:("," expression)* ","? "]"
                 {
                    return [e].concat(cleanAndFlatten(eArr))
                 }
query_object "QueryObjectExpr" = "{""}"
                 { return {} }
                / "{" oi:query_object_item oiArr:("," query_object_item)* ","? "}"
                {
                  return objOfArray([oi].concat(cleanAndFlatten(oiArr)))
                }
                / "{" oi:object_item oiArr:("," object_item)* ","? "}"
                 {
                   return objOfArray([oi].concat(cleanAndFlatten(oiArr)))
                 }

/* Any aggregation expression */
agg_field = agg_operator / field
agg_object_item = agg_field ":" agg_expression
agg_array  "AggregationArrayExpr" = "[""]"
                 { return [] }
               / "[" e:agg_expression eArr:("," agg_expression)* ","? "]"
                 {
                   return [e].concat(cleanAndFlatten(eArr))
                 }
               / "[" e:expression eArr:("," expression)* ","? "]"
                 {
                    return [e].concat(cleanAndFlatten(eArr))
                 }
agg_object "AggregationObjectExpr" = "{""}"
                 { return {} }
                / "{" oi:agg_object_item oiArr:("," agg_object_item)* ","? "}"
                 {
                   return objOfArray([oi].concat(cleanAndFlatten(oiArr)))
                 }
                / "{" oi:object_item oiArr:("," object_item)* ","? "}"
                 {
                   return objOfArray([oi].concat(cleanAndFlatten(oiArr)))
                 }

// Any non standard character needs to be in quotes for a fieldname
field "Field Name"
  = _ f:[_A-Za-z0-9] s:([_A-Za-z0-9 \\ .]*) { return f + s.join("") }
  / string_with_esc

///////////////////
// EXTENDED JSON //
///////////////////

// https://github.com/pegjs/pegjs/issues/517

bson_types = code
           / oid
           / binary
           / dbref
           / timestamp
           / numberlong
           / numberdecimal
           / numberint
           / maxkey
           / minkey
           / date
           / regexp
           / undefined

code            "Code"          = "Code"              s:anything    { return 'Code(' + s + ')' }
oid             "ObjectId"      = "ObjectId"          e:anything    { return 'ObjectId(' + e + ')' }
binary          "Binary"        = "Binary"            e:anything    { return 'Binary(' + e + ')' }
dbref           "DBRef"         = "DBRef"             e:anything    { return 'DBRef(' + e + ')' }
timestamp       "Timestamp"     = "Timestamp"         e:anything    { return 'Timestamp(' + e + ')' }
numberlong      "NumberLong"    = "NumberLong"        e:anything    { return 'NumberLong(' + e + ')' }
numberdecimal   "NumberDecimal" = "NumberDecimal"     e:anything    { return 'NumberDecimal(' + e + ')' }
numberint       "NumberInt"     = "NumberInt"         e:anything    { return 'NumberInt(' + e + ')' }
maxkey          "MaxKey"        = "MaxKey"            e:anything    { return 'MaxKey(' + e + ')' }
minkey          "MinKey"        = "MinKey"            e:anything    { return 'MinKey(' + e + ')' }
date            "Date"          = "Date"              e:anything    { return 'Date(' + e + ')' }
regexp          "RegExp"        = "RegExp"            e:anything    { return 'RegExp(' + e + ')' }
undefined       "Undefined"     = "Undefined"         e:anything    { return 'Undefined(' + e + ')' }

//////////////
// LITERALS //
//////////////

string_with_esc
  = '"' chars:DoubleStringCharacter* '"' { return checkNotOperator(chars.join('')); }
  / "'" chars:SingleStringCharacter* "'" { return checkNotOperator(chars.join('')); }

DoubleStringCharacter
  = !('"' / "\\") char:. { return char; }
  / "\\" sequence:EscapeSequence { return sequence; }

SingleStringCharacter
  = !("'" / "\\") char:. { return char; }
  / "\\" sequence:EscapeSequence { return sequence; }

EscapeSequence
  = "'"
  / '"'
  / "\\"
  / "b"  { return "\b";   }
  / "f"  { return "\f";   }
  / "n"  { return "\n";   }
  / "r"  { return "\r";   }
  / "t"  { return "\t";   }
  / "v"  { return "\x0B"; }

string "String"
  = '"' chars:DoubleStringCharacter* '"' { return chars.join(''); }
  / "'" chars:SingleStringCharacter* "'" { return chars.join(''); }

anything
  = "(" text:TextUntilTerminator ")" { return text.join(""); }

TextUntilTerminator
  = x:(&HaveTerminatorAhead .)* { return x.map(y => y[1]) }

HaveTerminatorAhead
  = . (!")" .)* ")"

// Float must come before integer or integer will be matched when floats occur
number "Number" = sign:"-"? digits:[0-9]+ '.' fraction:[0-9]* { return parseFloat(digits.join("") + '.' + fraction.join("")) * (sign === '-' ? -1 : 1) }
       / integer

integer "Integer" = positive_integer / "-" i:positive_integer { return -1 * i }

positive_integer "Positive Integer"                                  
  = digits:[0-9]+ { return parseInt(digits.join(""), 10)  }
                                                         
boolean "Boolean"
  = "true" { return true} / "false" { return false}

null = "null" { return null}

literal = string / number / boolean

_ "whitespace"
  = [ \t\n\r]*

                                                         
