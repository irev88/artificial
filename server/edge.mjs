// Public host adapter. The service credential is supplied *inside* the Edge
// Function; the static site has only its public endpoint, never database access.
import { day, entrySession, fail, joinRoom, newRoom, operate, sessionKey, view } from './rooms.mjs';
export async function serveRoom(req) {
  const headers = { 'Access-Control-Allow-Origin': 'https://irev88.github.io', 'Access-Control-Allow-Methods':'GET, POST, OPTIONS', 'Access-Control-Allow-Headers':'content-type', 'Cache-Control':'no-store', 'Content-Type':'application/json' };
  const answer=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
  if(req.method==='OPTIONS') return new Response(null,{status:204,headers});
  try {
    const path = new URL(req.url).pathname.split('/island-api').pop();
    if(path==='/status') return answer({online:true});
    if(!['POST','GET'].includes(req.method)) return answer({error:'Method not allowed.'},405);
    const text=req.method==='POST'?await req.text():''; if(text.length>4096) fail('Request too large.',413);
    const body=text?JSON.parse(text):{}, key=sessionKey(body,null);
    const base=Deno.env.get('SUPABASE_URL')+'/rest/v1/island_rooms', secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const db=async(method,query,payload)=>{
      const r=await fetch(base+'?'+query,{method,headers:{apikey:secret,Authorization:'Bearer '+secret,'Content-Type':'application/json',Prefer:'return=representation'},body:payload===undefined?undefined:JSON.stringify(payload)});
      if(!r.ok && r.status!==409) fail('The room service is temporarily unavailable.',503);
      return r.status===409?[]:r.json();
    };
    if(path==='/rooms'&&req.method==='POST') {
      const session=entrySession(key);
      // Opportunistic expiry, using the indexed timestamp (no public table scans).
      await db('DELETE',`updated_ms=lt.${Date.now()-day}&select=code`);
      for(let i=0;i<4;i++) {const room=newRoom(body,session.key);room.revision=1;
        if((await db('POST','select=code',{code:room.code,revision:1,updated_ms:room.updated,state:room})).length) return answer({...view(room,session.key),sessionToken:session.sessionToken},201);
      } fail('Could not reserve a room code. Try again.',503);
    }
    const match=path.match(/^\/rooms\/([A-Z2-9]{6})(?:\/([a-zA-Z]+))?$/i);if(!match)fail('Unknown endpoint.',404);
    const filter=`code=eq.${match[1].toUpperCase()}`;
    const [row]=await db('GET',filter+`&updated_ms=gt.${Date.now()-day}&select=state,revision`);
    if(!row)fail('Room not found. Check the code with your host.',404);
    const r=row.state,action=match[2],player=r.players.find(p=>key&&p.key===key);
    if((!action&&req.method==='GET')||(action==='state'&&req.method==='POST'))return answer(view(r,key));
    if(req.method!=='POST')fail('Method not allowed.',405);
    let effective=key,sessionToken,result;
    if(action==='join') {const session=entrySession(key);effective=session.key;sessionToken=session.sessionToken;if(player)return answer(view(r,key));joinRoom(r,body,effective);}
    else result=operate(r,player,action,body);
    r.updated=Date.now();r.revision=row.revision+1;
    // Compare-and-swap: simultaneous seats, turns and trades cannot overwrite each other.
    const cond=filter+`&revision=eq.${row.revision}&select=code`;
    const changed=result?.remove?await db('DELETE',cond):await db('PATCH',cond,{revision:r.revision,updated_ms:r.updated,state:r});
    if(!changed.length)fail('The table just changed. Please try again.',409);
    return answer(result?.left?{left:true}:{...view(r,effective),sessionToken});
  } catch(e) {return answer({error:e.message||'Room request failed.'},e.status||400);}
}
