// "Nyan, desu~~"
(function(D){
	//Contains the cached functions
	var templates = {};
	var helpers = {};
	var tagTypes = {
		"V":{name:"Var"},
		"{":{name:"Escaped"},
		"^":{name:"Template"},
		":":{name:"Helper"},
		"/":{name:"Close"},
		"#":{name:"Context"},
		"&":{name:"Iterate"},
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
		template = template.split("\\").join("\\\\").split("\n").join("\\n");
		while(true){
			res.push(template.slice(index,template.indexOf("{",index)));
			index = template.indexOf("}",index);
			if(template.charAt(index) ==="}")index++;
			if(template.charAt(index) ==="}")index++;
			if(template.indexOf("{",index) < 0){
				res.push(template.slice(index));
				break;
			}
		}
		return res;
	}
	
	function findClose(index, tag,tags){
		for(var i = index; i < tags.length; i++){
			if(tags[i].type === "/" && tags[i].tag === tag.tag)return i;
		}
		return -1;
	}
	function makePart(part, tags, text){
		tags = tags || extractTags(part);
		text = text || extractText(part);
		var fn = "";
		var t, c, d;
		for(var i = 0; i < tags.length; i++){
			if(text[i])fn+='res+="'+text[i]+'";\n';
			t = tags[i];
			if(t.type === "V"){
				fn+= "if(ctx."+t.tag+" !== undefined)\n\tres+=ctx."+t.tag+";\n";
			} else if(t.type === "{"){
				fn+= "if(ctx."+t.tag+" !== undefined)\n\tres+=esc(ctx."+t.tag+");\n";
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
					fn += "if(ctx."+t.tag+"){\n\t";
						fn += "ctxs.push(ctx);ctx=ctx['"+t.tag+"'];\n";
						fn += makePart(part.slice(t.end+1,tags[c].start));
					fn += "\nctx = ctxs.pop();}\n";
					i = c;
				}
			} else if(t.type === "&"){
				d = t.tag.split("=");
				t.tag = d[0];
				c = findClose(i,t,tags);
				if(c > -1){
					if(d){
						fn += "if(ctx."+d[0]+" && (typeof ctx."+d[0]+" === 'object') &&!(ctx."+d[0]+" instanceof String)){\n\t";
						fn += "var tm = ctx."+d[0]+";\n\t";
						fn += "ctxs.push(ctx);ctx = {};\n\t";
						fn += "for(var _i = 0; _i < tm.length; _i++){\n\t\t"
						fn += "ctx."+d[1]+"= tm[_i];\n";
						fn += makePart(part.slice(t.end+1,tags[c].start));
						fn += "\n}\nctx = ctxs.pop();\n}\n;";
					}
					i = c;
				}
			} else if(t.type === "^"){
				fn += "res += render('"+t.tag+"',ctx);\n";
			} else if(t.type === "%"){
				fn += "res+= ''+("+t.tag+");"
			} else if(t.type === ":"){
				t = t.tag.split(" ");
				c = t[1].split(",");
				t = t[0];
				for(var k = 0; k < c.length; k++)
					c[k] = '"'+c[k]+'"';
				fn += ";if(helpers['"+t+"']){\n\t";
				fn += "res+= helpers['"+t+"'].call(ctx";
				fn += (c ? ","+c : "")+");\n}\n"
			}
		}
		if(text[i])fn+='res+="'+text[i]+'";\n';
		return fn;
	}
	
	function make(template){
		var fn="(function(){\n";
		fn+= ";var ctxs=[],ctx=arguments[0],res='';\n";
		fn +=makePart(template);
		fn += "\nreturn res;\n})";
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
		templates[name] = res;
		return res;
	}
	
	function render(name, args){
		return (templates[name]) ?
			templates[name](args) : "";
	}
	function helper(name, fcn){
		helpers[name] = fcn;
	}
	D.extractTags = extractTags;
	D.extractText = extractText;
	D.escape = esc;
	D.make = make;
	D.compile= compile;
	D.render = render;
	D.helper = helper;
	D.templates = templates;
	D.helpers = helpers;
	return D;
})(typeof module == 'object' ? module.exports : window.Dirtstache = {});