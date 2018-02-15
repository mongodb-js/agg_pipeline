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
   // check that a fieldPath starts with '$'
   function checkIsFieldPath(s) {
        if (s.charAt(0) !== '$') {
             error("Field paths must begin with '$', field path was: " + s, location())
        }
        return s
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

// TODO: finish last few stages
stage_syntax =  
         "{" collStats    ":" collStats_document          "}"
       / "{" project      ":" project_document            "}"
       / "{" match        ":" match_document              "}"
//       / "{" "$redact"     ":" redact_document            "}"
       / "{" limit        ":" positive_integer            "}"
       / "{" skip         ":" positive_integer            "}"
       / "{" unwind       ":" unwind_document             "}"
       / "{" group        ":" group_document              "}"
//       / "{" "$sample"     ":" sample_document            "}"
       / "{" sort         ":" sort_document               "}"
//       / "{" "$geoNear"     ":" geoNear_document          "}"
       / "{" lookup       ":" lookup_document             "}"
       / "{" out          ":" string                      "}" // TODO: check is valid collection?
       / "{" indexStats   ":" indexStats_document         "}"
//       / "{" "$facet"     ":" facet_document              "}"
//       / "{" "$bucket"     ":" bucket_document            "}"
//       / "{" "$bucketAuto"     ":" bucketAuto_document    "}"
//       / "{" "$sortByCount"     ":" sortByCount_document  "}"
       / "{" addFields   ":" addFields_document          "}"
//       / "{" "$replaceRoot"     ":" replaceRoot_document  "}"
       / "{" count       ":" string                      "}"
//       / "{" "$graphLookup"     ":" graphLookup_document  "}"
       
                     
collStats "$collStats" = "$collStats" / "'$collStats'" { return '$collStats' } / '"$collStats"' { return '$collStats' }
collStats_document     = "{" ci:collStats_item cArr:("," collStats_item)* ","? "}" 
                       { 
                           return [ci].concat(cleanAndFlatten(cArr)) 
                       }
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

// I wish pegjs had macros...
latencyStats "latencyStats" = "latencyStats" / "'latencyStats'" { return 'latencyStats' } / '"latencyStats"' { return 'latencyStats' }
storageStats "storageStats" = "storageStats" / "'storageStats'" { return 'storageStats' } / '"storageStats"' { return 'storageStats' }
histograms   "histograms"   = "histograms"   / "'histograms'"   { return 'histograms'   } / '"histograms"'   { return 'histograms'   }

project "$project"= '"$project"' { return '$project' } / "'$project'" { return '$project' } / "$project"
// Project actually must have at least one item
project_document  = "{" s:project_item sArr:("," project_item)* ","? "}" 
                     { 
                        return objOfArray(checkExclusivity([s].concat(cleanAndFlatten(sArr)))) 
                     }
project_item =   i:id    ":" e:("0" / "false" / "1" / "true")              { return [i, ':', toBool(e)] }
               / f:field ":" e:("0" / "false" / "1" / "true" / expression) { return [f, ':', toBool(e)] } 

// This allows way more than a $match actually allows.  It might make sense to either check the AST
// for operators that aren't allowed in match, or to define this more particularly.  This is a good start.
match "$match" = '"$match"' { return '$match' } / "'$match'" { return '$match' } / "$match"
match_document = "{" "}" 
                     {
                         return {}
                     }
               / "{" s:match_item sArr:("," match_item)* ","? "}" 
                     { 
                         return objOfArray([s].concat(cleanAndFlatten(sArr))) 
                     }
match_item = field ":" expression
           / and   ":" array
           / or    ":" array
           / expr  ":" expression
and  "$and"  = '"$and"'  { return '$and'   }  / "'$and'"    { return '$and'   }  / "$and"
or   "$or"   = '"$or"'   { return '$or'    }  / "'$or'"     { return '$or'    }  / "$or"
// Yes, $expr actually allows any expression, and basically anything that isn't a document, 0, or false always
// results in matching everything
expr "$expr" = '"$expr"' { return '$expr'  }  / "'$expr'"   { return '$expr'  }  / "$expr"

limit "$limit"  = '"$limit"'  { return '$limit' }  / "'$limit'"  { return '$limit'  }  / "$limit"

skip  "$skip"   = '"$skip"'   { return '$skip' }   / "'$skip'"   { return '$skip'   }  / "$skip"

unwind "$unwind"= '"$unwind"' { return '$unwind' } / "'$unwind'" { return '$unwind' }  / "$unwind"
unwind_document = s:string 
                { return checkIsFieldPath(s) }
                / "{" u:unwind_item uArr:("," unwind_item)* ","? "}" 
                { 
                   return objOfArray([u].concat(cleanAndFlatten(uArr)))
                }
unwind_item =  p:path ":" s:string    { return [p, ':', checkIsFieldPath(s)] }
               / includeArrayIndex ":" string
               / preserveNullAndEmptyArrays ":" boolean
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

group "$group" = '"$group"' { return '$group' } / "'$group'" { return '$group' } / "$group"
group_document ="{" g:group_item gArr:("," group_item)* ","? "}" 
                { 
                     return objOfArray([g].concat(cleanAndFlatten(gArr)))
                }
group_item     = id ":" expression
               / f:field ":" "{" a:accumulator ":" e:expression "}" 
                {
                     var obj = {}
                     obj[a] = e
                     return [f, ":", obj]
                }
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

sort "$sort" = '"$sort"' { return '$sort' } / "'$sort'" { return '$sort' } / "$sort"
// need grammar for all of sort, should support top level expressions ($and and $or)
sort_document = "{" s:sort_item sArr:("," sort_item)* ","? "}" 
                    { 
                       return objOfArray([s].concat(cleanAndFlatten(sArr))) 
                    }
sort_item = f:field ":" i:integer

lookup "$lookup" = '"$lookup"' { return '$lookup' } / "'$lookup'" { return '$lookup' } / "$lookup"
lookup_document = "{" l:lookup_item lArr:("," lookup_item)* ","? "}" 
                   { 
                       return objOfArray([l].concat(cleanAndFlatten(lArr)))
                   }
lookup_item =  from           ":" string // TODO: perhaps check this is a valid collection
               / localField   ":" string // For some reason this doesn't need a $
               / foreignField ":" string 
               / as           ":" string
               / let_kw       ":" object
               / pipeline_kw  ":" pipeline 
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

out "out" = '"$out"' { return '$out' } / "'$out'" { return '$out' } / "$out"

indexStats "$indexStats" = '"$indexStats"' { return '$indexStats' } / "'$indexStats'" { return '$indexStats' } / "$indexStats"
// need grammar for all of indexStats, should support top level expressions ($and and $or)
indexStats_document = "{""}" 
                    { 
                       return {} 
                    }

addFields "$addFields" = '"$addFields"' { return '$addFields' } / "'$addFields'" { return '$addFields' } / "$addFields"
addFields_document = "{" a:addFields_item aArr:("," addFields_item)* ","? "}" 
                    { 
                       return objOfArray([a].concat(cleanAndFlatten(aArr))) 
                    }
addFields_item = f:field ":" expression

count "$count" = '"$count"' { return '$count' } / "'$count'" { return '$count' } / "$count"

/////////////////
// expressions //
/////////////////

// A few contexts allow only id.  Note that a context requiring id must come before field
// in alternatives because field will also match id.  PEGs process alternatives in left to right
// order, unlike context-free grammars, so this works.
id "_id" = '_id' / "'_id'" { return '_id' } / '"_id"' { return '_id' }

// TODO: Need to expand what can be an expression, need to add dates and whatnot
// (though these could just be checked in AST) let/map/functions/etc 
expression = number / string / boolean / null / array / object

// This is odd, but there's no other good way to allow for the optional trailing comma
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

field "Field Name" // TODO: better grammar for field names
  = f:[_A-Za-z] s:([_A-Za-z0-9]*) { return f + s.join("") }
  / string

string "String"
  = ["] str:(([^"\\] / "\\" . )*) ["] { return str.map(cleanBackSlashes).join("") } 
  / ['] str:(([^'\\] / "\\" . )*) ['] { return str.map(cleanBackSlashes).join("") }


// Float must come before integer or integer will be matched when floats occur
number "Number" = digits:[0-9]+ '.' fraction:[0-9]* { return parseFloat(digits.join("") + '.' + fraction.join("")) }
       / integer

integer "Integer" = positive_integer / "-" i:positive_integer { return -1 * i }

positive_integer "Positive Integer"                                  
  = digits:[0-9]+ { return parseInt(digits.join(""), 10)  }
                                                         
boolean 
  = "true" {return true} / "false" {return false} 

null = "null" {return null}
                                                         
                                                         
                                                         
