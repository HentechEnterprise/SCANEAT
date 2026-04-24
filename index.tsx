import React, { useEffect, useState, useRef } from "react";
import {
  Text, View, TouchableOpacity, SafeAreaView, StatusBar,
  ScrollView, TextInput, Modal, Animated, Dimensions,
  KeyboardAvoidingView, Platform, StyleSheet,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";

const API = "https://scaneat-nkix.onrender.com";
const { width: SW } = Dimensions.get("window");

// ─── DESIGN TOKENS ───────────────────────────────────────────
const C = {
  bg:          "#09100B",
  surface:     "#101A12",
  glass:       "rgba(255,255,255,0.04)",
  glassBorder: "rgba(255,255,255,0.09)",
  primary:     "#2ECC71",
  primaryDim:  "#1A7A43",
  primaryGlow: "rgba(46,204,113,0.14)",
  gold:        "#C9A84C",
  goldGlow:    "rgba(201,168,76,0.12)",
  text:        "#EDF7F0",
  textMuted:   "#5E7D65",
  textDim:     "#2E4A34",
  danger:      "#E85D5D",
  border:      "rgba(46,204,113,0.12)",
  white:       "#FFFFFF",
};

// ─── DATA ────────────────────────────────────────────────────
const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const DIET_PREFS_LIST = ["Vegetarian","Vegan","Gluten-Free","Dairy-Free","High Protein","Low Carb"];
const RECIPE_POOL = [
  {name:"Avocado Toast",desc:"Quick, healthy and delicious."},
  {name:"Tomato Rice Bowl",desc:"Simple comfort food in 20 mins."},
  {name:"Veggie Stir Fry",desc:"Use up whatever's in the pantry!"},
  {name:"Egg Fried Rice",desc:"Classic and easy weeknight meal."},
  {name:"Onion Soup",desc:"Warm and hearty."},
  {name:"Pasta Arrabbiata",desc:"Spicy tomato pasta, ready in 30 mins."},
];
const DIET_RECIPES: Record<string,{name:string;desc:string}[]> = {
  lose:     [{name:"Steamed Veggie Bowl",desc:"Light, fibre-rich and filling."},{name:"Tomato Soup",desc:"Low-calorie and warming."},{name:"Avocado Salad",desc:"Healthy fats, low sugar."}],
  maintain: [{name:"Egg Fried Rice",desc:"Balanced carbs and protein."},{name:"Chicken Wrap",desc:"Nutritious and satisfying."},{name:"Veggie Stir Fry",desc:"Colourful and well-rounded."}],
  gain:     [{name:"Peanut Butter Oats",desc:"High-calorie, protein-packed."},{name:"Chicken & Rice Bowl",desc:"Muscle-building classic."},{name:"Pasta with Egg",desc:"Dense carbs and protein combo."}],
};
const MEAL_TILES = [{label:"Breakfast",emoji:"🍳"},{label:"Lunch",emoji:"🥗"},{label:"Dinner",emoji:"🍽"},{label:"Snacks",emoji:"🍎"}];
const TIME_TILES  = [{label:"Under 30 mins",emoji:"⚡"},{label:"Under 1 hour",emoji:"🕐"},{label:"Under 2 hours",emoji:"🕑"}];

// ─── SMALL COMPONENTS ────────────────────────────────────────
function GlassCard({children,style}:any){
  return(
    <View style={[{backgroundColor:C.glass,borderWidth:1,borderColor:C.glassBorder,borderRadius:20,overflow:"hidden"},style]}>
      {children}
    </View>
  );
}

function SmartInput({style,...props}:any){
  const [foc,setFoc]=useState(false);
  return(
    <TextInput
      placeholderTextColor={C.textMuted}
      onFocus={()=>setFoc(true)}
      onBlur={()=>setFoc(false)}
      style={[{
        backgroundColor:C.glass,borderWidth:1,
        borderColor:foc?C.primary:C.glassBorder,
        borderRadius:14,paddingHorizontal:16,paddingVertical:14,
        color:C.text,fontSize:15,letterSpacing:0.3,
      },style]}
      {...props}
    />
  );
}

function Pill({label,accent=false}:{label:string;accent?:boolean}){
  return(
    <View style={{backgroundColor:accent?C.primaryGlow:C.glass,borderWidth:1,borderColor:accent?C.border:C.glassBorder,borderRadius:20,paddingHorizontal:12,paddingVertical:5}}>
      <Text style={{color:accent?C.primary:C.textMuted,fontSize:12,fontWeight:"600",letterSpacing:0.5}}>{label}</Text>
    </View>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────
export default function HomeScreen(){
  const [items,setItems]=useState<any[]>([]);
  const [scanning,setScanning]=useState(false);
  const [permission,requestPermission]=useCameraPermissions();
  const scanLock=useRef(false);

  const [welcomeName,setWelcomeName]=useState("Chef");
  const [editNameModal,setEditNameModal]=useState(false);
  const [nameInput,setNameInput]=useState("");

  const [toast,setToast]=useState("");
  const toastOp=useRef(new Animated.Value(0)).current;
  const toastY=useRef(new Animated.Value(10)).current;

  const [suggestion,setSuggestion]=useState(RECIPE_POOL[0]);

  const [searchQuery,setSearchQuery]=useState("");

  const [mealPlanVisible,setMealPlanVisible]=useState(false);
  const [mealPlan,setMealPlan]=useState<Record<string,string[]>>({});
  const [addMealDay,setAddMealDay]=useState("");
  const [addMealModal,setAddMealModal]=useState(false);
  const [addMealInput,setAddMealInput]=useState("");

  const [chatVisible,setChatVisible]=useState(false);
  const [chatMsgs,setChatMsgs]=useState([{role:"bot",text:"Hello! Ask me for recipe ideas 👋"}]);
  const [chatInput,setChatInput]=useState("");
  const chatRef=useRef<ScrollView>(null);

  const [dietVisible,setDietVisible]=useState(false);
  const [dietGoal,setDietGoal]=useState("");

  const [profileVisible,setProfileVisible]=useState(false);
  const [dietPrefs,setDietPrefs]=useState<string[]>([]);

  const [catVisible,setCatVisible]=useState(false);
  const [currentCat,setCurrentCat]=useState("");
  const [catRecipes,setCatRecipes]=useState<string[]>([]);
  const [addRecipeModal,setAddRecipeModal]=useState(false);
  const [addRecipeInput,setAddRecipeInput]=useState("");

  const [favs,setFavs]=useState<{name:string;category:string}[]>([]);

  const [confirmModal,setConfirmModal]=useState(false);
  const [confirmMsg,setConfirmMsg]=useState("");
  const [confirmCb,setConfirmCb]=useState<()=>void>(()=>()=>{});

  const fadeIn=useRef(new Animated.Value(0)).current;
  const slideUp=useRef(new Animated.Value(24)).current;

  useEffect(()=>{
    loadPantry();
    Animated.parallel([
      Animated.timing(fadeIn,{toValue:1,duration:700,useNativeDriver:true}),
      Animated.timing(slideUp,{toValue:0,duration:700,useNativeDriver:true}),
    ]).start();
  },[]);

  // ── TOAST ──────────────────────────────────────────────────
  function showToast(msg:string){
    setToast(msg);
    toastOp.setValue(0); toastY.setValue(10);
    Animated.parallel([
      Animated.timing(toastOp,{toValue:1,duration:220,useNativeDriver:true}),
      Animated.timing(toastY,{toValue:0,duration:220,useNativeDriver:true}),
    ]).start(()=>{
      setTimeout(()=>Animated.timing(toastOp,{toValue:0,duration:320,useNativeDriver:true}).start(),2200);
    });
  }

  function appConfirm(msg:string,cb:()=>void){setConfirmMsg(msg);setConfirmCb(()=>cb);setConfirmModal(true);}
  function refreshSuggestion(){setSuggestion(RECIPE_POOL[Math.floor(Math.random()*RECIPE_POOL.length)]);}
  function isFav(name:string,cat:string){return favs.some(f=>f.name===name&&f.category===cat);}
  function toggleFav(name:string,cat:string){
    if(isFav(name,cat)) setFavs(p=>p.filter(f=>!(f.name===name&&f.category===cat)));
    else setFavs(p=>[...p,{name,category:cat}]);
  }

  // ── API ────────────────────────────────────────────────────
  async function loadPantry(){
    try{const r=await fetch(API+"/pantry");const d=await r.json();setItems(d);}catch(e){}
  }
  async function resetPantry(){
    try{await fetch(API+"/pantry",{method:"DELETE"});loadPantry();showToast("Pantry cleared");}catch(e){}
  }
  async function scanned({data}:any){
    if(scanLock.current)return;
    scanLock.current=true;setScanning(false);
    try{
      const lk=await fetch(API+"/lookup/"+data);
      const food=await lk.json();
      await fetch(API+"/pantry",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(food)});
      loadPantry();showToast("✓ Item added");
    }catch(e){}
    setTimeout(()=>{scanLock.current=false;},2000);
  }

  function sendChat(){
    if(!chatInput.trim())return;
    const msg=chatInput.trim();
    setChatMsgs(p=>[...p,{role:"user",text:msg}]);
    setChatInput("");
    setTimeout(()=>{
      setChatMsgs(p=>[...p,{role:"bot",text:"Great question! I'll suggest recipes once connected to the backend 🍳"}]);
      chatRef.current?.scrollToEnd({animated:true});
    },600);
  }

  function runSearch(){
    const q=searchQuery.trim().toLowerCase();
    if(!q)return;
    const f=items.find(i=>i.name.toLowerCase().includes(q));
    showToast(f?"✓ Found: "+f.name:"✕ Not found");
  }

  if(!permission)return <View style={{flex:1,backgroundColor:C.bg}}/>;
  if(!permission.granted){
    return(
      <SafeAreaView style={{flex:1,justifyContent:"center",alignItems:"center",backgroundColor:C.bg}}>
        <Text style={{color:C.text,fontSize:17,marginBottom:20,letterSpacing:0.4}}>Camera access required</Text>
        <TouchableOpacity style={S.btnPrimary} onPress={requestPermission}>
          <Text style={S.btnPrimaryTxt}>Allow Camera</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return(
    <View style={{flex:1,backgroundColor:C.bg}}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg}/>
      {/* ambient glow */}
      <View style={{position:"absolute",top:-60,left:SW*0.15,width:SW*0.7,height:220,backgroundColor:C.primaryGlow,borderRadius:999,transform:[{scaleX:1.6}]}} pointerEvents="none"/>

      <SafeAreaView style={{flex:1}}>
        <Animated.ScrollView
          style={{flex:1,opacity:fadeIn,transform:[{translateY:slideUp}]}}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{paddingBottom:50}}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── TOPBAR ── */}
          <View style={S.topbar}>
            <View style={{flex:1, marginRight:12}}>
  <Text style={S.appLabel}>SCANEAT</Text>
  <Text style={S.welcome}>{"Welcome,\n"}{welcomeName}</Text>
              <TouchableOpacity onPress={()=>{setNameInput(welcomeName);setEditNameModal(true);}}>
                <Text style={{color:C.textMuted,fontSize:11,marginTop:3,letterSpacing:0.5}}>✏  Edit name</Text>
              </TouchableOpacity>
            </View>
            <View style={{flexDirection:"row",gap:8,flexShrink:0}}>
              {[{i:"🍴",l:"Meals",fn:()=>setMealPlanVisible(true)},{i:"💬",l:"Chat",fn:()=>setChatVisible(true)},{i:"🏃",l:"Diet",fn:()=>setDietVisible(true)},{i:"👤",l:"Profile",fn:()=>setProfileVisible(true)}].map((b,k)=>(
                <TouchableOpacity key={k} style={S.iconBtn} onPress={b.fn} activeOpacity={0.7}>
                  <Text style={{fontSize:18}}>{b.i}</Text>
                  <Text style={{color:C.textMuted,fontSize:9,marginTop:2,letterSpacing:0.3}}>{b.l}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── SUGGESTION BANNER ── */}
          <View style={{marginHorizontal:20,marginTop:10,marginBottom:22}}>
            <LinearGradient colors={["#163825","#0C2016"]} start={{x:0,y:0}} end={{x:1,y:1}} style={{borderRadius:22,padding:20,overflow:"hidden"}}>
              <View style={{position:"absolute",top:-40,right:-20,width:150,height:150,backgroundColor:C.primaryGlow,borderRadius:999}} pointerEvents="none"/>
              <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                <View>
                  <Text style={S.bannerLabel}>BASED ON YOUR PANTRY</Text>
                  <Text style={S.bannerTitle}>Recipes for you</Text>
                </View>
                <TouchableOpacity style={S.refreshBtn} onPress={refreshSuggestion}>
                  <Text style={{color:C.primary,fontSize:13,fontWeight:"600"}}>↻ Refresh</Text>
                </TouchableOpacity>
              </View>
              <View style={{backgroundColor:"rgba(255,255,255,0.05)",borderRadius:14,padding:16}}>
                <Text style={{color:C.text,fontSize:16,fontWeight:"700",marginBottom:4,letterSpacing:0.3}}>{suggestion.name}</Text>
                <Text style={{color:C.textMuted,fontSize:13}}>{suggestion.desc}</Text>
              </View>
            </LinearGradient>
          </View>

          {/* ── SCAN ── */}
          <View style={{marginHorizontal:20,marginBottom:22}}>
            <GlassCard style={{padding:20}}>
              <Text style={S.sectionTitle}>Scan Food</Text>
              <Text style={{color:C.textMuted,fontSize:13,marginBottom:16,marginTop:4}}>Point camera at any barcode to add to your pantry</Text>
              <TouchableOpacity style={S.btnPrimary} onPress={()=>setScanning(true)} activeOpacity={0.8}>
                <Text style={S.btnPrimaryTxt}>📷  Start Scanning</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[S.btnGhost,{marginTop:10}]} onPress={()=>appConfirm("Clear all pantry items?",resetPantry)} activeOpacity={0.7}>
                <Text style={{color:C.danger,fontSize:14,fontWeight:"600",letterSpacing:0.3}}>🗑  Clear Pantry</Text>
              </TouchableOpacity>
            </GlassCard>
          </View>

          {/* ── CAMERA ── */}
          {scanning&&(
            <View style={{marginHorizontal:20,marginBottom:22,borderRadius:20,overflow:"hidden",borderWidth:1,borderColor:C.border}}>
              <TouchableOpacity style={{position:"absolute",top:12,right:12,zIndex:10,backgroundColor:C.danger,paddingHorizontal:14,paddingVertical:7,borderRadius:20}} onPress={()=>setScanning(false)}>
                <Text style={{color:C.white,fontWeight:"700",fontSize:13}}>✕  Cancel</Text>
              </TouchableOpacity>
              <CameraView style={{height:260}} onBarcodeScanned={scanning?scanned:undefined}/>
              <View style={{position:"absolute",top:"35%",left:"15%",width:"70%",height:100,borderWidth:2,borderColor:C.primary,borderRadius:14}} pointerEvents="none"/>
              <View style={{position:"absolute",bottom:0,left:0,right:0,height:48,backgroundColor:"rgba(0,0,0,0.55)",justifyContent:"center"}}>
                <Text style={{color:C.textMuted,textAlign:"center",fontSize:12,letterSpacing:0.6}}>Align barcode within the frame</Text>
              </View>
            </View>
          )}

          {/* ── PANTRY ITEMS ── */}
          <View style={{marginHorizontal:20,marginBottom:22}}>
            <View style={S.sectionHeader}>
              <Text style={S.sectionTitle}>Pantry Items</Text>
              <Pill label={`${items.length} items`} accent/>
            </View>
            {items.length===0?(
              <GlassCard style={{padding:24,alignItems:"center"}}>
                <Text style={{fontSize:36,marginBottom:10}}>🥦</Text>
                <Text style={{color:C.textMuted,fontSize:13,textAlign:"center",lineHeight:20}}>Your pantry is empty{"\n"}Scan a food item to begin</Text>
              </GlassCard>
            ):(
              <View style={{flexDirection:"row",flexWrap:"wrap",gap:10}}>
                {items.map((item:any)=>(
                  <GlassCard key={item.id} style={{paddingHorizontal:14,paddingVertical:10,flexDirection:"row",alignItems:"center",gap:8}}>
                    <Text style={{color:C.text,fontSize:14,letterSpacing:0.2}}>{item.name}</Text>
                    {item.quantity&&<Pill label={`×${item.quantity}`} accent/>}
                  </GlassCard>
                ))}
              </View>
            )}
          </View>

          {/* ── SEARCH ── */}
          <View style={{marginHorizontal:20,marginBottom:22,flexDirection:"row",gap:10}}>
            <SmartInput style={{flex:1}} placeholder="Search pantry..." value={searchQuery} onChangeText={setSearchQuery} onSubmitEditing={runSearch} returnKeyType="search"/>
            <TouchableOpacity style={[S.btnPrimary,{paddingHorizontal:20}]} onPress={runSearch} activeOpacity={0.8}>
              <Text style={S.btnPrimaryTxt}>Go</Text>
            </TouchableOpacity>
          </View>

          {/* ── MEAL TYPE TILES ── */}
          <View style={{marginBottom:22}}>
            <Text style={[S.sectionTitle,{marginHorizontal:20,marginBottom:14}]}>Meal Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:20,gap:12}}>
              {MEAL_TILES.map(({label,emoji})=>(
                <TouchableOpacity key={label} onPress={()=>{setCurrentCat(label);setCatRecipes([]);setCatVisible(true);}} activeOpacity={0.8}>
                  <LinearGradient colors={["#163825","#0C2016"]} style={{borderRadius:20,padding:20,alignItems:"center",width:SW*0.36,height:110,justifyContent:"center"}}>
                    <Text style={{fontSize:30,marginBottom:8}}>{emoji}</Text>
                    <Text style={{color:C.text,fontWeight:"700",fontSize:14,letterSpacing:0.3}}>{label}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* ── COOK TIME TILES ── */}
          <View style={{marginBottom:22}}>
            <Text style={[S.sectionTitle,{marginHorizontal:20,marginBottom:14}]}>Cook Time</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:20,gap:12}}>
              {TIME_TILES.map(({label,emoji})=>(
                <TouchableOpacity key={label} onPress={()=>{setCurrentCat(label);setCatRecipes([]);setCatVisible(true);}} activeOpacity={0.8}>
                  <GlassCard style={{padding:18,alignItems:"center",minWidth:130,height:100,justifyContent:"center"}}>
                    <Text style={{fontSize:26,marginBottom:6}}>{emoji}</Text>
                    <Text style={{color:C.text,fontSize:13,fontWeight:"600",letterSpacing:0.3,textAlign:"center"}}>{label}</Text>
                  </GlassCard>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* ── FAVORITES ── */}
          <View style={{marginHorizontal:20,marginBottom:20}}>
            <View style={S.sectionHeader}>
              <Text style={S.sectionTitle}>My Favorites ❤️</Text>
              {favs.length>0&&(
                <TouchableOpacity onPress={()=>appConfirm("Clear all favorites?",()=>setFavs([]))}>
                  <Text style={{color:C.danger,fontSize:12,fontWeight:"600",letterSpacing:0.3}}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>
            {favs.length===0?(
              <Text style={{color:C.textMuted,fontSize:13,fontStyle:"italic"}}>Heart a recipe to save it here.</Text>
            ):(
              favs.map((fav,i)=>(
                <GlassCard key={i} style={{padding:14,flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <View style={{flexDirection:"row",alignItems:"center",gap:10}}>
                    <View style={{backgroundColor:C.goldGlow,borderWidth:1,borderColor:C.gold,paddingHorizontal:10,paddingVertical:3,borderRadius:20}}>
                      <Text style={{color:C.gold,fontSize:11,fontWeight:"600"}}>{fav.category}</Text>
                    </View>
                    <Text style={{color:C.text,fontSize:14}}>{fav.name}</Text>
                  </View>
                  <TouchableOpacity onPress={()=>toggleFav(fav.name,fav.category)}>
                    <Text style={{color:C.textMuted,fontSize:16}}>✕</Text>
                  </TouchableOpacity>
                </GlassCard>
              ))
            )}
          </View>

        </Animated.ScrollView>
      </SafeAreaView>

      {/* ── TOAST ── */}
      <Animated.View pointerEvents="none" style={{position:"absolute",bottom:90,alignSelf:"center",backgroundColor:"#101A12",borderWidth:1,borderColor:C.border,paddingHorizontal:22,paddingVertical:12,borderRadius:30,opacity:toastOp,transform:[{translateY:toastY}]}}>
        <Text style={{color:C.text,fontSize:13,letterSpacing:0.3}}>{toast}</Text>
      </Animated.View>

      {/* ════ MODALS ════ */}

      {/* EDIT NAME */}
      <Modal visible={editNameModal} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS==="ios"?"padding":"height"} style={{flex:1}}>
          <View style={S.overlay}>
            <View style={S.modal}>
              <Text style={S.modalTitle}>Your Name</Text>
              <SmartInput value={nameInput} onChangeText={setNameInput} placeholder="Enter your name..." maxLength={30} autoFocus returnKeyType="done"
                onSubmitEditing={()=>{if(nameInput.trim())setWelcomeName(nameInput.trim());setEditNameModal(false);}}/>
              <View style={S.modalActions}>
                <TouchableOpacity style={S.btnGhost} onPress={()=>setEditNameModal(false)}><Text style={{color:C.textMuted,fontWeight:"600"}}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={S.btnPrimary} onPress={()=>{if(nameInput.trim())setWelcomeName(nameInput.trim());setEditNameModal(false);}}><Text style={S.btnPrimaryTxt}>Save</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* CONFIRM */}
      <Modal visible={confirmModal} transparent animationType="fade">
        <View style={S.overlay}>
          <View style={S.modal}>
            <Text style={{fontSize:15,color:C.text,lineHeight:22}}>{confirmMsg}</Text>
            <View style={S.modalActions}>
              <TouchableOpacity style={S.btnGhost} onPress={()=>setConfirmModal(false)}><Text style={{color:C.textMuted,fontWeight:"600"}}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[S.btnPrimary,{backgroundColor:C.danger}]} onPress={()=>{setConfirmModal(false);confirmCb();}}><Text style={S.btnPrimaryTxt}>Confirm</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MEAL PLANNER */}
      <Modal visible={mealPlanVisible} animationType="slide">
        <View style={{flex:1,backgroundColor:C.bg}}>
          <StatusBar barStyle="light-content"/>
          <SafeAreaView style={{flex:1}}>
            <View style={S.screenHeader}><TouchableOpacity style={S.backBtn} onPress={()=>setMealPlanVisible(false)}><Text style={{color:C.text,fontSize:20}}>←</Text></TouchableOpacity><Text style={S.screenTitle}>Meal Planner</Text></View>
            <ScrollView contentContainerStyle={{padding:20,paddingBottom:40}}>
              {DAYS.map(day=>(
                <GlassCard key={day} style={{padding:16,marginBottom:12}}>
                  <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <Text style={{color:C.text,fontWeight:"700",fontSize:14,letterSpacing:0.8}}>{day.toUpperCase()}</Text>
                    <TouchableOpacity style={[S.btnPrimary,{paddingHorizontal:14,paddingVertical:7}]} onPress={()=>{setAddMealDay(day);setAddMealInput("");setAddMealModal(true);}}>
                      <Text style={[S.btnPrimaryTxt,{fontSize:12}]}>+ Add</Text>
                    </TouchableOpacity>
                  </View>
                  {(mealPlan[day]||[]).length===0?(
                    <Text style={{color:C.textDim,fontSize:12,fontStyle:"italic"}}>No meals planned</Text>
                  ):(
                    (mealPlan[day]||[]).map((meal,i)=>(
                      <View key={i} style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center",backgroundColor:"rgba(255,255,255,0.04)",borderRadius:10,paddingHorizontal:12,paddingVertical:9,marginTop:6}}>
                        <Text style={{color:C.text,fontSize:13}}>{meal}</Text>
                        <TouchableOpacity onPress={()=>{const u={...mealPlan};u[day].splice(i,1);setMealPlan({...u});}}><Text style={{color:C.textMuted}}>✕</Text></TouchableOpacity>
                      </View>
                    ))
                  )}
                </GlassCard>
              ))}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* ADD MEAL */}
      <Modal visible={addMealModal} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS==="ios"?"padding":"height"} style={{flex:1}}>
          <View style={S.overlay}>
            <View style={S.modal}>
              <Text style={S.modalTitle}>Add meal for {addMealDay}</Text>
              <SmartInput value={addMealInput} onChangeText={setAddMealInput} placeholder="e.g. Avocado Toast" autoFocus returnKeyType="done"
                onSubmitEditing={()=>{if(addMealInput.trim()){setMealPlan(p=>({...p,[addMealDay]:[...(p[addMealDay]||[]),addMealInput.trim()]}));setAddMealModal(false);}}}/>
              <View style={S.modalActions}>
                <TouchableOpacity style={S.btnGhost} onPress={()=>setAddMealModal(false)}><Text style={{color:C.textMuted,fontWeight:"600"}}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={S.btnPrimary} onPress={()=>{if(addMealInput.trim()){setMealPlan(p=>({...p,[addMealDay]:[...(p[addMealDay]||[]),addMealInput.trim()]}));setAddMealModal(false);}}}><Text style={S.btnPrimaryTxt}>Add</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* CHAT */}
      <Modal visible={chatVisible} animationType="slide">
        <View style={{flex:1,backgroundColor:C.bg}}>
          <StatusBar barStyle="light-content"/>
          <SafeAreaView style={{flex:1}}>
            <View style={S.screenHeader}><TouchableOpacity style={S.backBtn} onPress={()=>setChatVisible(false)}><Text style={{color:C.text,fontSize:20}}>←</Text></TouchableOpacity><Text style={S.screenTitle}>AI Chat</Text></View>
            <KeyboardAvoidingView behavior={Platform.OS==="ios"?"padding":"height"} style={{flex:1}}>
              <ScrollView ref={chatRef} style={{flex:1,padding:16}} onContentSizeChange={()=>chatRef.current?.scrollToEnd({animated:true})}>
                {chatMsgs.map((m,i)=>(
                  <View key={i} style={[{maxWidth:"80%",padding:14,borderRadius:18,marginBottom:10},m.role==="user"?{backgroundColor:C.primary,alignSelf:"flex-end"}:{backgroundColor:C.glass,borderWidth:1,borderColor:C.glassBorder,alignSelf:"flex-start"}]}>
                    <Text style={{color:m.role==="user"?C.bg:C.text,fontSize:14,lineHeight:20}}>{m.text}</Text>
                  </View>
                ))}
              </ScrollView>
              <View style={{flexDirection:"row",borderTopWidth:1,borderTopColor:C.border,padding:12,gap:10}}>
                <TextInput style={{flex:1,backgroundColor:C.glass,borderWidth:1,borderColor:C.glassBorder,borderRadius:14,paddingHorizontal:16,paddingVertical:12,color:C.text,fontSize:14}} value={chatInput} onChangeText={setChatInput} placeholder="Type here..." placeholderTextColor={C.textMuted} onSubmitEditing={sendChat} returnKeyType="send"/>
                <TouchableOpacity style={{width:48,height:48,backgroundColor:C.primary,borderRadius:14,alignItems:"center",justifyContent:"center"}} onPress={sendChat}>
                  <Text style={{color:C.bg,fontWeight:"800",fontSize:18}}>↑</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* DIET */}
      <Modal visible={dietVisible} animationType="slide">
        <View style={{flex:1,backgroundColor:C.bg}}>
          <StatusBar barStyle="light-content"/>
          <SafeAreaView style={{flex:1}}>
            <View style={S.screenHeader}><TouchableOpacity style={S.backBtn} onPress={()=>setDietVisible(false)}><Text style={{color:C.text,fontSize:20}}>←</Text></TouchableOpacity><Text style={S.screenTitle}>Diet Plan</Text></View>
            <ScrollView contentContainerStyle={{padding:20,paddingBottom:40}}>
              <Text style={{color:C.textMuted,fontSize:14,marginBottom:18,letterSpacing:0.3}}>What's your goal?</Text>
              {[{key:"lose",icon:"📉",label:"Lose Weight",desc:"Low-calorie recipes from your pantry"},{key:"maintain",icon:"⚖️",label:"Maintain Weight",desc:"Balanced, nutritious meals"},{key:"gain",icon:"📈",label:"Gain Weight",desc:"High-protein, calorie-dense recipes"}].map(g=>(
                <TouchableOpacity key={g.key} onPress={()=>setDietGoal(g.key)} activeOpacity={0.8} style={{marginBottom:12}}>
                  <GlassCard style={[{padding:18,flexDirection:"row",alignItems:"center",gap:16},dietGoal===g.key&&{borderColor:C.primary,borderWidth:2,backgroundColor:C.primaryGlow}]}>
                    <Text style={{fontSize:28}}>{g.icon}</Text>
                    <View><Text style={{color:C.text,fontWeight:"700",fontSize:15,letterSpacing:0.3}}>{g.label}</Text><Text style={{color:C.textMuted,fontSize:12,marginTop:3}}>{g.desc}</Text></View>
                  </GlassCard>
                </TouchableOpacity>
              ))}
              {dietGoal!==""&&(
                <View style={{marginTop:8}}>
                  <Text style={{color:C.primary,fontWeight:"700",fontSize:12,letterSpacing:1.5,marginBottom:14}}>{dietGoal==="lose"?"WEIGHT LOSS RECIPES":dietGoal==="maintain"?"BALANCED RECIPES":"MUSCLE GAIN RECIPES"}</Text>
                  {(DIET_RECIPES[dietGoal]||[]).map((s,i)=>(
                    <GlassCard key={i} style={{padding:14,marginBottom:10}}>
                      <Text style={{color:C.text,fontWeight:"600",fontSize:14}}>{s.name}</Text>
                      <Text style={{color:C.textMuted,fontSize:12,marginTop:4}}>{s.desc}</Text>
                    </GlassCard>
                  ))}
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* PROFILE */}
      <Modal visible={profileVisible} animationType="slide">
        <View style={{flex:1,backgroundColor:C.bg}}>
          <StatusBar barStyle="light-content"/>
          <SafeAreaView style={{flex:1}}>
            <View style={S.screenHeader}><TouchableOpacity style={S.backBtn} onPress={()=>setProfileVisible(false)}><Text style={{color:C.text,fontSize:20}}>←</Text></TouchableOpacity><Text style={S.screenTitle}>My Profile</Text></View>
            <ScrollView contentContainerStyle={{padding:20,paddingBottom:40}}>
              <View style={{alignItems:"center",marginBottom:28}}>
                <LinearGradient colors={[C.primary,C.primaryDim]} style={{width:80,height:80,borderRadius:40,alignItems:"center",justifyContent:"center"}}>
                  <Text style={{color:C.bg,fontSize:30,fontWeight:"800"}}>{welcomeName.charAt(0).toUpperCase()}</Text>
                </LinearGradient>
                <Text style={{color:C.text,fontSize:20,fontWeight:"700",marginTop:14,letterSpacing:0.5}}>{welcomeName}</Text>
              </View>
              <View style={{flexDirection:"row",gap:14,marginBottom:28}}>
                {[{num:items.length,label:"Pantry Items"},{num:favs.length,label:"Favorites"}].map((s,i)=>(
                  <GlassCard key={i} style={{flex:1,padding:18,alignItems:"center"}}>
                    <Text style={{color:C.primary,fontSize:28,fontWeight:"800"}}>{s.num}</Text>
                    <Text style={{color:C.textMuted,fontSize:12,marginTop:4,letterSpacing:0.5}}>{s.label}</Text>
                  </GlassCard>
                ))}
              </View>
              <Text style={{color:C.textMuted,fontSize:11,fontWeight:"700",letterSpacing:1.5,marginBottom:14}}>DIETARY PREFERENCES</Text>
              <View style={{flexDirection:"row",flexWrap:"wrap",gap:10}}>
                {DIET_PREFS_LIST.map(p=>(
                  <TouchableOpacity key={p} onPress={()=>setDietPrefs(prev=>prev.includes(p)?prev.filter(x=>x!==p):[...prev,p])}>
                    <View style={[{paddingHorizontal:14,paddingVertical:9,borderRadius:20,borderWidth:1,borderColor:C.glassBorder,backgroundColor:C.glass},dietPrefs.includes(p)&&{backgroundColor:C.primary,borderColor:C.primary}]}>
                      <Text style={{color:dietPrefs.includes(p)?C.bg:C.textMuted,fontSize:13,fontWeight:"600"}}>{p}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* CATEGORY */}
      <Modal visible={catVisible} animationType="slide">
        <View style={{flex:1,backgroundColor:C.bg}}>
          <StatusBar barStyle="light-content"/>
          <SafeAreaView style={{flex:1}}>
            <View style={S.screenHeader}><TouchableOpacity style={S.backBtn} onPress={()=>setCatVisible(false)}><Text style={{color:C.text,fontSize:20}}>←</Text></TouchableOpacity><Text style={S.screenTitle}>{currentCat}</Text></View>
            <ScrollView contentContainerStyle={{padding:20,paddingBottom:130}}>
              {catRecipes.length===0?(
                <Text style={{color:C.textMuted,fontSize:13,fontStyle:"italic",marginTop:6}}>No recipes added yet.</Text>
              ):(
                catRecipes.map((r,i)=>(
                  <GlassCard key={i} style={{padding:14,marginBottom:10,flexDirection:"row",justifyContent:"space-between",alignItems:"center"}}>
                    <Text style={{color:C.text,fontSize:14,flex:1}}>{r}</Text>
                    <View style={{flexDirection:"row",gap:14,alignItems:"center"}}>
                      <TouchableOpacity onPress={()=>toggleFav(r,currentCat)}><Text style={{fontSize:18}}>{isFav(r,currentCat)?"❤️":"🤍"}</Text></TouchableOpacity>
                      <TouchableOpacity onPress={()=>setCatRecipes(p=>p.filter((_,j)=>j!==i))}><Text style={{color:C.textMuted,fontSize:16}}>✕</Text></TouchableOpacity>
                    </View>
                  </GlassCard>
                ))
              )}
            </ScrollView>
            <View style={{position:"absolute",bottom:0,left:0,right:0,padding:20,paddingBottom:34,gap:10,backgroundColor:C.surface,borderTopWidth:1,borderTopColor:C.border}}>
              <TouchableOpacity style={S.btnGhost} onPress={()=>appConfirm(`Clear all in "${currentCat}"?`,()=>setCatRecipes([]))}>
                <Text style={{color:C.danger,fontWeight:"600",letterSpacing:0.3}}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={S.btnPrimary} onPress={()=>{setAddRecipeInput("");setAddRecipeModal(true);}}>
                <Text style={S.btnPrimaryTxt}>+ Add Recipe</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* ADD RECIPE */}
      <Modal visible={addRecipeModal} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS==="ios"?"padding":"height"} style={{flex:1}}>
          <View style={S.overlay}>
            <View style={S.modal}>
              <Text style={S.modalTitle}>Add to {currentCat}</Text>
              <SmartInput value={addRecipeInput} onChangeText={setAddRecipeInput} placeholder="e.g. Tomato Pasta" autoFocus returnKeyType="done"
                onSubmitEditing={()=>{if(addRecipeInput.trim()){setCatRecipes(p=>[...p,addRecipeInput.trim()]);setAddRecipeInput("");setAddRecipeModal(false);}}}/>
              <View style={S.modalActions}>
                <TouchableOpacity style={S.btnGhost} onPress={()=>setAddRecipeModal(false)}><Text style={{color:C.textMuted,fontWeight:"600"}}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={S.btnPrimary} onPress={()=>{if(addRecipeInput.trim()){setCatRecipes(p=>[...p,addRecipeInput.trim()]);setAddRecipeInput("");setAddRecipeModal(false);}}}><Text style={S.btnPrimaryTxt}>Add</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

// ─── STYLESHEET ───────────────────────────────────────────────
const S = StyleSheet.create({
  topbar:       {flexDirection:"row",justifyContent:"space-between",alignItems:"flex-start",paddingHorizontal:20,paddingTop:16,paddingBottom:12},
  appLabel:     {fontSize:11,fontWeight:"800",letterSpacing:3,color:C.primary,marginBottom:4},
  welcome:      {fontSize:21,fontWeight:"700",color:C.text,letterSpacing:0.3},
  iconBtn:      {alignItems:"center",backgroundColor:C.glass,borderWidth:1,borderColor:C.glassBorder,borderRadius:14,paddingHorizontal:10,paddingVertical:8,minWidth:50},
  bannerLabel:  {fontSize:10,fontWeight:"700",letterSpacing:2,color:C.primary,marginBottom:4},
  bannerTitle:  {fontSize:20,fontWeight:"800",color:C.text,letterSpacing:0.3},
  refreshBtn:   {backgroundColor:C.primaryGlow,borderWidth:1,borderColor:C.border,paddingHorizontal:14,paddingVertical:8,borderRadius:20},
  sectionHeader:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:14},
  sectionTitle: {fontSize:17,fontWeight:"700",color:C.text,letterSpacing:0.3},
  overlay:      {flex:1,backgroundColor:"rgba(0,0,0,0.75)",justifyContent:"center",alignItems:"center",padding:20},
  modal:        {backgroundColor:C.surface,borderWidth:1,borderColor:C.glassBorder,borderRadius:24,padding:24,width:"100%",gap:16},
  modalTitle:   {fontSize:17,fontWeight:"700",color:C.text,letterSpacing:0.3},
  modalActions: {flexDirection:"row",gap:10,justifyContent:"flex-end"},
  btnPrimary:   {backgroundColor:C.primary,paddingHorizontal:20,paddingVertical:14,borderRadius:14,alignItems:"center"},
  btnPrimaryTxt:{color:C.bg,fontWeight:"800",fontSize:14,letterSpacing:0.5},
  btnGhost:     {paddingHorizontal:20,paddingVertical:14,borderRadius:14,alignItems:"center",borderWidth:1,borderColor:C.glassBorder},
  screenHeader: {flexDirection:"row",alignItems:"center",gap:14,padding:20,borderBottomWidth:1,borderBottomColor:C.border},
  screenTitle:  {fontSize:18,fontWeight:"700",color:C.text,letterSpacing:0.3},
  backBtn:      {width:42,height:42,borderRadius:12,backgroundColor:C.glass,borderWidth:1,borderColor:C.glassBorder,alignItems:"center",justifyContent:"center"},
});