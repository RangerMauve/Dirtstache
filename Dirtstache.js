// "Nyan, desu~~"
(function(D){
	//Contains the cached functions
	D.templates = {};
	var tagTypes = {
		"V":{name:"Var"},
		"{":{name:"Escaped"},
		"^":{name:"Template"},
		":":{name:"Helper"},
		"/":{name:"Close"},
		"#":{name:"Iterate"},
		"?":{name:"Truthy"},
		"!":{name:"Falsey"},
		"%":{name:"Raw"},
		"*":{name:"Inherit"},
		">":{name:"ParentBlock"},
		"<":{name:"ChilrBlock"}
	}
	
	function extractTags(template){
		var ob = {template:template,index:0,tags:[],types:[]};
		while(template.indexOf("{",ob.index) >= 0){
			nextTag(ob);
		}
		ob.tags.types = ob.types;
		return ob.tags;
	}
	
	function esc(str){
    	 str = str.replace(/\</g,"&lt;");
    	 str = str.replace(/\>/g,"&gt;");
		 return str;
	}
	
	function nextTag(ob){
		var st = ob.template.indexOf("{",ob.index);
		if(ob.template.charAt(st-2) == "\\")return ob.index = st;
		var end = ob.template.indexOf("}",st);
		if(ob.template.charAt(end-1) == "}")end++;
		else if(ob.template.charAt(end-1) == "%")end--;
		
		var tag = ob.template.slice(st+1,end);
		var type = tag.charAt(0);
		if(!tagTypes[type])type="V";
		if(type!=="V")tag = tag.slice(1);
		ob.tags.push({
			tag:tag,
			type:type,
			start:st,
			end:end
		});
		ob.types.push(type);
		ob.index = end;
	}
	
	function extractText(template){
		var res = [];
		var index = 0;
		template = template.split("\n").join("\\n");
		while(true){
			res.push(template.slice(index,template.indexOf("{",index)));
			index = template.indexOf("}",index+1)+1;
			if(template.charAt(index) ==="}")index++;
			if(index <= 0)break;
		}
		return res;
	}
	
	function findClose(index, tag,tags){
		for(var i = index; i < tags.length; i++){
			if(tags[i].type === "/" && tags[i].tag === tag.tag)return i;
		}
		return -1;
	}
	function makePart(part){
		var tags = extractTags(part);
		var text = extractText(part);
		var fn = "";
		var t, c;
		for(var i = 0; i < tags.length; i++){
			if(text[i])fn+='res+="'+text[i]+'";\n';
			t = tags[i];
			if(t.type === "V"){
				fn+= "if(ctx."+t.tag+" !== undefined)\n\tres+=ctx."+t.tag+";\n";
			} else if(t.type === "{"){
				fn+= "if(ctx."+t.tag+" !== undefined)\n\tres+=D.escape(ctx."+t.tag+");\n";
			} else if(t.type === "?"){
				c = findClose(i,t,tags);
				if(c > -1){
					fn += "if(ctx."+t.tag+"){\n";
					fn += makePart(part.slice(t.end+1,tags[c].start));
					fn += "\n}\n";
					i = c;
				}
			} else if(t.type === "!"){
				c = findClose(i,t,tags);
				if(c > -1){
					fn += "if(!ctx."+t.tag+"){\n";
					fn += makePart(part.slice(t.end+1,tags[c].start));
					fn += "\n}\n";
					i = c;
				}
			} else if(t.type === "#"){
				c = findClose(i,t,tags);
				if(c > -1){
					fn += "if(ctx."+t.tag+"){\n";
					fn += "ctxs.push(ctx);ctx=ctx['"+t.tag+"'];\n"
					fn += makePart(part.slice(t.end+1,tags[c].start));
					fn += "\n;ctx = ctxs.pop();\n}"
					i = c;
				}
			}
		}
		if(text[i])fn+='res+="'+text[i]+'";\n';
		return fn;
	}
	
	function make(template){
		var fn="(function(){\n\n";
		fn+= ";var ctxs=[],ctx=arguments[0],D=arguments[1] || Dirtstache,res='';\n";
		fn +=makePart(template);
		fn += ";\n\nreturn res;})";
		return fn;
	}
	
	function compile(name,template){
		var fn = make(template);
		var res;
		try{
			res = eval(fn);
		} catch (err){
			console.error(err);
			res = function(){return "Error parsing template:"+err;};
		}
		D.templates[name] = res;
		return res;
	}
	D.extractTags = extractTags;
	D.extractText = extractText;
	Dirtstache.escape = esc;
	D.make = make;
	D.compile= compile;
	return D;
})(typeof module == 'object' ? module.exports : window.Dirtstache = {});