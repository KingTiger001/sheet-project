/* ssf.js (C) 2013 SheetJS -- http://sheetjs.com */
var SSF;
(function(SSF){
String.prototype.reverse=function(){return this.split("").reverse().join("");};
var _strrev = function(x) { return String(x).reverse(); };
function fill(c,l) { return new Array(l+1).join(c); }
function pad(v,d){var t=String(v);return t.length>=d?t:(fill(0,d-t.length)+t);}
/* Options */
var opts_fmt = {};
function fixopts(o){for(var y in opts_fmt) if(o[y]===undefined) o[y]=opts_fmt[y];}
SSF.opts = opts_fmt;
opts_fmt.date1904 = 0;
opts_fmt.output = "";
opts_fmt.mode = "";
var table_fmt = {
  1:  '0',
  2:  '0.00',
  3:  '#,##0',
  4:  '#,##0.00',
  9:  '0%',
  10: '0.00%',
  11: '0.00E+00',
  12: '# ?/?',
  13: '# ??/??',
  14: 'mm/dd/yy',
  15: 'd-mmm-yy',
  16: 'd-mmm',
  17: 'mmm-yy',
  18: 'h:mm AM/PM',
  19: 'h:mm:ss AM/PM',
  20: 'h:mm',
  21: 'h:mm:ss',
  22: 'm/d/yy h:mm',
  37: '#,##0 ;(#,##0)',
  38: '#,##0 ;[Red](#,##0)',
  39: '#,##0.00;(#,##0.00)',
  40: '#,##0.00;[Red](#,##0.00)',
  45: 'mm:ss',
  46: '[h]:mm:ss',
  47: 'mmss.0',
  48: '##0.0E+0',
  49: '@'
};
var days = [
  ['Sun', 'Sunday'],
  ['Mon', 'Monday'],
  ['Tue', 'Tuesday'],
  ['Wed', 'Wednesday'],
  ['Thu', 'Thursday'],
  ['Fri', 'Friday'],
  ['Sat', 'Saturday']
];
var months = [
  ['J', 'Jan', 'January'],
  ['F', 'Feb', 'February'],
  ['M', 'Mar', 'March'],
  ['A', 'Apr', 'April'],
  ['M', 'May', 'May'],
  ['J', 'Jun', 'June'],
  ['J', 'Jul', 'July'],
  ['A', 'Aug', 'August'],
  ['S', 'Sep', 'September'],
  ['O', 'Oct', 'October'],
  ['N', 'Nov', 'November'],
  ['D', 'Dec', 'December']
];
var frac = function(x, D, mixed) {
    var n1 = Math.floor(x), d1 = 1;
    var n2 = n1+1, d2 = 1;
    if(x !== n1) while(d1 <= D && d2 <= D) {
        var m = (n1 + n2) / (d1 + d2);
        if(x === m) {
            if(d1 + d2 <= D) d1+=d2, n1+=n2, d2=D+1;
            else if(d1 > d2) d2=D+1;
            else d1=D+1;
            break;
        }
        else if(x < m) n2 = n1+n2, d2 = d1+d2;
        else n1 = n1+n2, d1 = d1+d2;
    }
    if(d1 > D) d1 = d2, n1 = n2;
    if(!mixed) return [0, n1, d1];
    var q = Math.floor(n1/d1);
    return [q, n1 - q*d1, d1];
};
var general_fmt = function(v) {
  if(typeof v === 'boolean') return v ? "TRUE" : "FALSE";
  if(typeof v === 'number') {
    return v.toString().substr(0,11);
  }
  if(typeof v === 'string') return v;
  throw "unsupport value in General format: " + v;
};
SSF._general = general_fmt;
var parse_date_code = function parse_date_code(v,opts) {
  var date = Math.floor(v), time = Math.round(86400 * (v - date)), dow=0;
  var dout=[], out={D:date, T:time}; fixopts(opts = (opts||{}));
  if(opts.date1904) date += 1462;
  if(date === 60) {dout = [1900,2,29]; dow=3;}
  else {
    if(date > 60) --date;
    /* 1 = Jan 1 1900 */
    var d = new Date(1900,0,1);
    d.setDate(d.getDate() + date - 1);
    dout = [d.getFullYear(), d.getMonth()+1,d.getDate()];
    dow = d.getDay();
    if(opts.mode === 'excel' && date < 60) dow = (dow + 6) % 7;
  }
  out.y = dout[0]; out.m = dout[1]; out.d = dout[2];
  out.S = time % 60; time = Math.floor(time / 60);
  out.M = time % 60; time = Math.floor(time / 60);
  out.H = time;
  out.q = dow;
  return out;
};
SSF.parse_date_code = parse_date_code;
var write_date = function(type, fmt, val) {
  switch(type) {
    case 'y': switch(fmt) { /* year */
      case 'y': case 'yy': return pad(val.y % 100,2);
      default: return val.y;
    } break;
    case 'm': switch(fmt) { /* month */
      case 'm': return val.m;
      case 'mm': return pad(val.m,2);
      case 'mmm': return months[val.m-1][1];
      case 'mmmm': return months[val.m-1][2];
      case 'mmmmm': return months[val.m-1][0];
      default: throw 'bad month format: ' + fmt;
    } break;
    case 'd': switch(fmt) { /* day */
      case 'd': return val.d;
      case 'dd': return pad(val.d,2);
      case 'ddd': return days[val.q][0];
      case 'dddd': return days[val.q][1];
      default: throw 'bad day format: ' + fmt;
    } break;
    case 'h': switch(fmt) { /* 12-hour */
      case 'h': return 1+(val.H+11)%12;
      case 'hh': return pad(1+(val.H+11)%12, 2);
      default: throw 'bad hour format: ' + fmt;
    } break;
    case 'H': switch(fmt) { /* 24-hour */
      case 'h': return val.H;
      case 'hh': return pad(val.H, 2);
      default: throw 'bad hour format: ' + fmt;
    } break;
    case 'M': switch(fmt) { /* minutes */
      case 'm': return val.M;
      case 'mm': return pad(val.M, 2);
      default: throw 'bad minute format: ' + fmt;
    } break;
    case 's': switch(fmt) { /* seconds */
      case 's': return val.S;
      case 'ss': return pad(val.S, 2);
      case 'ss.0': console.log(val);
      default: throw 'bad second format: ' + fmt;
    } break;
    case 'Z': switch(fmt) {
      case '[h]': return val.D*24+val.H;
      default: throw 'bad abstime format: ' + fmt;
    } break;
    /* TODO: handle the ECMA spec format ee -> yy */
    case 'e': { return val.y; } break;
    case 'A': return (val.h>=12 ? 'P' : 'A') + fmt.substr(1);
    default: throw 'bad format type ' + type + ' in ' + fmt;
  }
};
String.prototype.reverse = function() { return this.split("").reverse().join(""); }
var commaify = function(s) { return s.reverse().replace(/.../g,"$&,").reverse(); };
var write_num = function(type, fmt, val) {
  var mul = 0;
  fmt = fmt.replace(/%/g,function(x) { mul++; return ""; });
  if(mul !== 0) return write_num(type, fmt, val * Math.pow(10,2*mul)) + fill("%",mul);
  if(fmt.indexOf("E") > -1) {
    var o = val.toExponential(fmt.indexOf("E") - fmt.indexOf(".") - 1);
    if(fmt.match(/E\+00$/) && o.match(/e[+-][0-9]$/)) o = o.substr(0,o.length-1) + "0" + o[o.length-1];
    if(fmt.match(/E\-/) && o.match(/e\+/)) o = o.replace(/e\+/,"e");
    return o.replace("e","E");
  }
  var ff;
  switch(fmt) {
    case "0": return Math.round(val);
    case "0.00": return Math.round(val*100)/100;
    case "#,##0": return commaify(String(Math.round(val)));
    case "#,##0.00": return commaify(String(Math.floor(val))) + "." + Math.round((val-Math.floor(val))*100);
    case "# ? / ?": ff = frac(val, 10, true); return ff[0] + " " + ff[1] + "/" + ff[2];  
    case "# ?? / ??": ff = frac(val, 100, true); return ff[0] + " " + ff[1] + "/" + ff[2];  
    default: 
  }
  throw new Error("unsupported format |" + fmt + "|");
};
function split_fmt(fmt) {
  var out = [];
  var in_str = -1;
  for(var i = 0, j = 0; i < fmt.length; ++i) {
    if(in_str != -1) { if(fmt[i] == '"') in_str = -1; continue; }
    if(fmt[i] == "_" || fmt[i] == "*" || fmt[i] == "\\") { ++i; continue; }
    if(fmt[i] == '"') { in_str = i; continue; }
    if(fmt[i] != ";") continue;
    out.push(fmt.slice(j,i));
    j = i+1;
  }
  out.push(fmt.slice(j));
  if(in_str !=-1) throw "Format |" + fmt + "| unterminated string at " + in_str;
  return out;
}
SSF._split = split_fmt;
function eval_fmt(fmt, v, opts) {
  var out = [], o = "", i = 0, c = "", lst='t', q = {}, dt;
  fixopts(opts = (opts || {}));
  var hr='H';
  /* Tokenize */
  while(i < fmt.length) {
    switch((c = fmt[i])) {
      case '"': /* Literal text */
        for(o="";fmt[++i] !== '"';) o += fmt[(fmt[i] === '\\' ? ++i : i)];
        out.push({t:'t', v:o}); break;
      case '\\': out.push({t:'t', v:fmt[++i]}); ++i; break;
      case '@': /* Text Placeholder */
        out.push({t:'T', v:v}); ++i; break;
      /* Dates */
      case 'm': case 'd': case 'y': case 'h': case 's': case 'e':
        if(!dt) dt = parse_date_code(v, opts);
        o = fmt[i]; while(fmt[++i] === c) o+=c;
        if(c === 's' && fmt[i] === '.' && fmt[i+1] === '0') { o+='.'; while(fmt[++i] === '0') o+= '0'; }
        if(c === 'm' && lst.toLowerCase() === 'h') c = 'M'; /* m = minute */
        if(c === 'h') c = hr;
        q={t:c, v:o}; out.push(q); lst = c; break;
      case 'A':
        if(!dt) dt = parse_date_code(v, opts);
        q={t:c,v:"A"};
        if(fmt.substr(i, 3) === "A/P") {q.v = dt.H >= 12 ? "P" : "A"; q.t = 'T'; hr='h';i+=3;}
        else if(fmt.substr(i,5) === "AM/PM") { q.v = dt.H >= 12 ? "PM" : "AM"; q.t = 'T'; i+=5; hr='h'; }
        else q.t = "t";
        out.push(q); lst = c; break;
      case '[': /* TODO: Fix this -- ignore all conditionals and formatting */
        o = c;
        while(fmt[i++] !== ']') o += fmt[i];
        if(o == "[h]") out.push({t:'Z', v:o}); 
        break;
      /* Numbers */
      case '0': case '#':
        var nn = ""; while("0#?.,E+-%".indexOf(c=fmt[i++]) > -1) nn += c;
        out.push({t:'n', v:nn}); break;
      case '?':
        o = fmt[i]; while(fmt[++i] === c) o+=c;
        q={t:c, v:o}; out.push(q); lst = c; break;

      default:
        if("$-+/():!^&'~{}<>= ".indexOf(c) === -1)
          throw 'unrecognized character ' + fmt[i] + ' in ' + fmt;
        out.push({t:'t', v:c}); ++i; break;
    }
  }

  /* walk backwards */
  for(i=out.length-1, lst='t'; i >= 0; --i) {
    switch(out[i].t) {
      case 'h': case 'H': out[i].t = hr; lst='h'; break;
      case 'd': case 'y': case 's': case 'M': case 'e': lst=out[i].t; break;
      case 'm': if(lst === 's') out[i].t = 'M'; break;
    }
  }

  /* replace fields */
  for(i=0; i < out.length; ++i) {
    switch(out[i].t) {
      case 't': case 'T': break;
      case 'd': case 'm': case 'y': case 'h': case 'H': case 'M': case 's': case 'A': case 'e': case 'Z': 
        out[i].v = write_date(out[i].t, out[i].v, dt);
        out[i].t = 't'; break;
      case 'n':
        var jj = i+1;
        while(out[jj] && (out[jj].t == '?' || out[jj].t == 't' && out[jj].v == '/')) {
          out[i].v += ' ' + out[jj].v; delete out[jj]; ++jj
        }
        out[i].v = write_num(out[i].t, out[i].v, v);
        out[i].t = 't'; 
        i = jj; break;
      default: throw "unrecognized type " + out[i].t;
    }
  }

  return out.map(function(x){return x.v;}).join("");
}
SSF._eval = eval_fmt;
function choose_fmt(fmt, v) {
  if(typeof fmt === "string") fmt = split_fmt(fmt);
  if(typeof v !== "number") return fmt[3];
  return v > 0 ? fmt[0] : v < 0 ? fmt[1] : fmt[2];
}

var format = function format(fmt,v,o) {
  fixopts(o = (o||{}));
  if(fmt === 0) return general_fmt(v, o);
  if(typeof fmt === 'number') fmt = table_fmt[fmt];
  var f = choose_fmt(fmt, v, o);
  return eval_fmt(f, v, o);
};

SSF._choose = choose_fmt;
SSF._table = table_fmt;
SSF.load = function(fmt, idx) { table_fmt[idx] = fmt; };
SSF.format = format;
})(typeof exports !== 'undefined' ? exports : SSF);
