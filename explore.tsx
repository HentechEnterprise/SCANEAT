import React, { useState, useCallback, useRef } from "react";
import {
  View, Text, SafeAreaView, TouchableOpacity, TextInput,
  Modal, Animated, Dimensions, KeyboardAvoidingView,
  Platform, StyleSheet, StatusBar, FlatList,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useFocusEffect } from "expo-router";
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
  text:        "#EDF7F0",
  textMuted:   "#5E7D65",
  textDim:     "#2E4A34",
  danger:      "#E85D5D",
  border:      "rgba(46,204,113,0.12)",
  white:       "#FFFFFF",
};

// ─── SMALL COMPONENTS ────────────────────────────────────────
function GlassCard({children,style}:any){
  return(
    <View style={[{backgroundColor:C.glass,borderWidth:1,borderColor:C.glassBorder,borderRadius:20,overflow:"hidden"},style]}>
      {children}
    </View>
  );
}

function SmartInput({style,multiline,...props}:any){
  const [foc,setFoc]=useState(false);
  return(
    <TextInput
      placeholderTextColor={C.textMuted}
      onFocus={()=>setFoc(true)}
      onBlur={()=>setFoc(false)}
      multiline={multiline}
      textAlignVertical={multiline?"top":undefined}
      style={[{
        backgroundColor:C.glass,
        borderWidth:1,
        borderColor:foc?C.primary:C.glassBorder,
        borderRadius:14,
        paddingHorizontal:16,
        paddingVertical:14,
        color:C.text,
        fontSize:15,
        letterSpacing:0.3,
      },style]}
      {...props}
    />
  );
}

// ─── MAIN ─────────────────────────────────────────────────────
export default function ExploreScreen(){
  const [items,setItems]=useState<any[]>([]);
  const [recipes,setRecipes]=useState<string[]>([]);
  const [selected,setSelected]=useState("");
  const [note,setNote]=useState("");
  const [pantryRecipes,setPantryRecipes]=useState<string[]>([]);

  const [confirmModal,setConfirmModal]=useState(false);
  const [confirmMsg,setConfirmMsg]=useState("");
  const [confirmCb,setConfirmCb]=useState<()=>void>(()=>()=>{});

  const toastOp=useRef(new Animated.Value(0)).current;
  const toastY=useRef(new Animated.Value(10)).current;
  const [toast,setToast]=useState("");

  const fadeIn=useRef(new Animated.Value(0)).current;
  const slideUp=useRef(new Animated.Value(20)).current;

  useFocusEffect(
    useCallback(()=>{
      loadPantry();
      loadPantryRecipes();
      Animated.parallel([
        Animated.timing(fadeIn,{toValue:1,duration:600,useNativeDriver:true}),
        Animated.timing(slideUp,{toValue:0,duration:600,useNativeDriver:true}),
      ]).start();
    },[])
  );

  // ── HELPERS ──────────────────────────────────────────────
  function showToast(msg:string){
    setToast(msg);
    toastOp.setValue(0);toastY.setValue(10);
    Animated.parallel([
      Animated.timing(toastOp,{toValue:1,duration:220,useNativeDriver:true}),
      Animated.timing(toastY,{toValue:0,duration:220,useNativeDriver:true}),
    ]).start(()=>{
      setTimeout(()=>Animated.timing(toastOp,{toValue:0,duration:320,useNativeDriver:true}).start(),2200);
    });
  }

  function appConfirm(msg:string,cb:()=>void){setConfirmMsg(msg);setConfirmCb(()=>cb);setConfirmModal(true);}

  // ── API ───────────────────────────────────────────────────
  async function loadPantry(){
    const r=await fetch(API+"/pantry");
    if(!r.ok)return;
    const data=await r.json();
    setItems(data);
    if(data.length===0){setSelected("");setRecipes([]);}
  }

  async function loadRecipes(name:string){
    if(selected===name){setSelected("");setRecipes([]);return;}
    try{
      const[defRes,cusRes]=await Promise.all([fetch(API+"/recipes/"+name),fetch(API+"/recipes/custom/"+name)]);
      if(!defRes.ok||!cusRes.ok)return;
      const[defData,cusData]=await Promise.all([defRes.json(),cusRes.json()]);
      setSelected(name);
      setRecipes([...defData,...cusData]);
    }catch(err){console.log("Recipe load failed",err);}
  }

  async function deleteItem(id:number){
    await fetch(API+"/pantry/"+id,{method:"DELETE"});
    setSelected("");setRecipes([]);
    loadPantry();showToast("Item removed");
  }

  async function saveRecipe(){
    if(!note.trim())return;
    await fetch(API+"/recipes/custom",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({item:selected,recipe:note})});
    setRecipes(prev=>[...prev,note]);
    setNote("");
    showToast("✓ Recipe saved");
  }

  async function deleteRecipe(recipe:string){
    await fetch(API+"/recipes/custom/"+selected+"/"+recipe,{method:"DELETE"});
    setRecipes(prev=>prev.filter(r=>r!==recipe));
    showToast("Recipe deleted");
  }

  async function loadPantryRecipes(){
    const r=await fetch(API+"/recipes/pantry");
    if(!r.ok)return;
    const data=await r.json();
    setPantryRecipes(data);
  }

  // ─────────────────────────────────────────────────────────
  return(
    <View style={{flex:1,backgroundColor:C.bg}}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg}/>

      {/* ambient glow */}
      <View style={{position:"absolute",top:-60,right:-40,width:200,height:200,backgroundColor:C.primaryGlow,borderRadius:999}} pointerEvents="none"/>

      <SafeAreaView style={{flex:1}}>
        <KeyboardAwareScrollView
          enableOnAndroid
          enableAutomaticScroll
          extraScrollHeight={130}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{flexGrow:1,paddingBottom:120}}
        >
          <Animated.View style={{opacity:fadeIn,transform:[{translateY:slideUp}]}}>

            {/* ── HEADER ── */}
            <View style={{paddingHorizontal:20,paddingTop:18,paddingBottom:14}}>
              <Text style={S.appLabel}>MY PANTRY</Text>
              <Text style={S.pageTitle}>Cook what{"\n"}you have</Text>
              <Text style={{color:C.textMuted,fontSize:13,marginTop:6,letterSpacing:0.3}}>Tap an ingredient to discover recipes</Text>
            </View>

            {/* ── COOK WITH WHAT YOU HAVE ── */}
            <View style={{marginHorizontal:20,marginBottom:24}}>
              <LinearGradient colors={["#163825","#0C2016"]} start={{x:0,y:0}} end={{x:1,y:1}} style={{borderRadius:22,padding:20,overflow:"hidden"}}>
                <View style={{position:"absolute",top:-30,left:-20,width:130,height:130,backgroundColor:C.primaryGlow,borderRadius:999}} pointerEvents="none"/>
                <Text style={S.bannerLabel}>AI SUGGESTIONS</Text>
                <Text style={S.bannerTitle}>Cook With What You Have</Text>
                <View style={{marginTop:14,gap:10}}>
                  {pantryRecipes.length===0?(
                    <View style={{backgroundColor:"rgba(255,255,255,0.05)",borderRadius:14,padding:16}}>
                      <Text style={{color:C.textMuted,fontSize:13,fontStyle:"italic"}}>No recipes yet. Scan ingredients to generate recipes.</Text>
                    </View>
                  ):(
                    pantryRecipes.map((r,i)=>(
                      <View key={i} style={{backgroundColor:"rgba(255,255,255,0.06)",borderRadius:14,padding:14}}>
                        <Text style={{color:C.text,fontSize:15,fontWeight:"600",letterSpacing:0.3}}>{r}</Text>
                      </View>
                    ))
                  )}
                </View>
              </LinearGradient>
            </View>

            {/* ── PANTRY HEADER ── */}
            <View style={{paddingHorizontal:20,marginBottom:14,flexDirection:"row",justifyContent:"space-between",alignItems:"center"}}>
              <Text style={S.sectionTitle}>Pantry Ingredients</Text>
              <View style={{backgroundColor:C.primaryGlow,borderWidth:1,borderColor:C.border,borderRadius:20,paddingHorizontal:12,paddingVertical:5}}>
                <Text style={{color:C.primary,fontSize:12,fontWeight:"600",letterSpacing:0.5}}>{items.length} items</Text>
              </View>
            </View>

            {/* ── PANTRY LIST ── */}
            {items.length===0?(
              <View style={{marginHorizontal:20,marginBottom:20}}>
                <GlassCard style={{padding:24,alignItems:"center"}}>
                  <Text style={{fontSize:36,marginBottom:10}}>🌿</Text>
                  <Text style={{color:C.textMuted,fontSize:13,textAlign:"center",lineHeight:20}}>Your pantry is empty{"\n"}Go scan some food items</Text>
                </GlassCard>
              </View>
            ):(
              <View style={{paddingHorizontal:20,gap:12,marginBottom:8}}>
                {items.map((item:any)=>(
                  <TouchableOpacity
                    key={item.id}
                    onPress={()=>loadRecipes(item.name)}
                    activeOpacity={0.8}
                  >
                    <GlassCard style={[{padding:18,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},selected===item.name&&{borderColor:C.primary,borderWidth:2,backgroundColor:C.primaryGlow}]}>
                      <View style={{flex:1}}>
                        <Text style={{fontSize:16,fontWeight:"600",color:C.text,letterSpacing:0.3,marginBottom:4}}>{item.name}</Text>
                        <View style={{alignSelf:"flex-start",backgroundColor:selected===item.name?"rgba(46,204,113,0.25)":C.glass,borderWidth:1,borderColor:selected===item.name?C.primary:C.glassBorder,borderRadius:20,paddingHorizontal:10,paddingVertical:3}}>
                          <Text style={{color:selected===item.name?C.primary:C.textMuted,fontSize:12,fontWeight:"600"}}>×{item.quantity}</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={()=>appConfirm(`Remove "${item.name}" from pantry?`,()=>deleteItem(item.id))}
                        style={{backgroundColor:"rgba(232,93,93,0.15)",borderWidth:1,borderColor:"rgba(232,93,93,0.3)",paddingHorizontal:14,paddingVertical:8,borderRadius:12,marginLeft:12}}
                      >
                        <Text style={{color:C.danger,fontWeight:"700",fontSize:13}}>Remove</Text>
                      </TouchableOpacity>
                    </GlassCard>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* ── RECIPES PANEL ── */}
            {recipes.length>0&&(
              <View style={{marginHorizontal:20,marginTop:16,marginBottom:8}}>
                <LinearGradient colors={["#163825","#0D2018"]} start={{x:0,y:0}} end={{x:1,y:1}} style={{borderRadius:22,padding:20,overflow:"hidden"}}>
                  <View style={{position:"absolute",bottom:-30,right:-20,width:120,height:120,backgroundColor:C.primaryGlow,borderRadius:999}} pointerEvents="none"/>

                  {/* title */}
                  <View style={{marginBottom:16}}>
                    <Text style={S.bannerLabel}>RECIPE IDEAS</Text>
                    <Text style={S.bannerTitle}>Recipes with {selected}</Text>
                  </View>

                  {/* recipe list */}
                  <View style={{gap:10,marginBottom:20}}>
                    {recipes.map((item,index)=>(
                      <View key={index} style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center",backgroundColor:"rgba(255,255,255,0.05)",borderRadius:14,paddingHorizontal:14,paddingVertical:12}}>
                        <Text style={{flex:1,fontSize:14,color:C.text,lineHeight:20}}>{item}</Text>
                        <TouchableOpacity
                          onPress={()=>appConfirm(`Delete this recipe?`,()=>deleteRecipe(item))}
                          style={{marginLeft:12}}
                        >
                          <Text style={{color:C.danger,fontWeight:"600",fontSize:13}}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>

                  {/* divider */}
                  <View style={{height:1,backgroundColor:"rgba(255,255,255,0.08)",marginBottom:18}}/>

                  {/* custom recipe */}
                  <Text style={{color:C.text,fontWeight:"700",fontSize:14,letterSpacing:0.3,marginBottom:12}}>Create Custom Recipe</Text>

                  <SmartInput
                    value={note}
                    onChangeText={setNote}
                    placeholder="Write your own recipe here..."
                    multiline
                    style={{minHeight:130,maxHeight:220}}
                  />

                  <TouchableOpacity
                    style={[S.btnPrimary,{marginTop:14}]}
                    onPress={saveRecipe}
                    activeOpacity={0.8}
                  >
                    <Text style={S.btnPrimaryTxt}>Save Recipe</Text>
                  </TouchableOpacity>

                </LinearGradient>
              </View>
            )}

          </Animated.View>
        </KeyboardAwareScrollView>
      </SafeAreaView>

      {/* ── TOAST ── */}
      <Animated.View pointerEvents="none" style={{position:"absolute",bottom:90,alignSelf:"center",backgroundColor:"#101A12",borderWidth:1,borderColor:C.border,paddingHorizontal:22,paddingVertical:12,borderRadius:30,opacity:toastOp,transform:[{translateY:toastY}]}}>
        <Text style={{color:C.text,fontSize:13,letterSpacing:0.3}}>{toast}</Text>
      </Animated.View>

      {/* CONFIRM MODAL */}
      <Modal visible={confirmModal} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS==="ios"?"padding":"height"} style={{flex:1}}>
          <View style={S.overlay}>
            <View style={S.modal}>
              <Text style={{fontSize:15,color:C.text,lineHeight:22}}>{confirmMsg}</Text>
              <View style={S.modalActions}>
                <TouchableOpacity style={S.btnGhost} onPress={()=>setConfirmModal(false)}>
                  <Text style={{color:C.textMuted,fontWeight:"600"}}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[S.btnPrimary,{backgroundColor:C.danger}]} onPress={()=>{setConfirmModal(false);confirmCb();}}>
                  <Text style={S.btnPrimaryTxt}>Confirm</Text>
                </TouchableOpacity>
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
  appLabel:    {fontSize:10,fontWeight:"800",letterSpacing:3,color:C.primary,marginBottom:6},
  pageTitle:   {fontSize:32,fontWeight:"800",color:C.text,letterSpacing:0.3,lineHeight:38},
  bannerLabel: {fontSize:10,fontWeight:"700",letterSpacing:2,color:C.primary,marginBottom:4},
  bannerTitle: {fontSize:18,fontWeight:"800",color:C.text,letterSpacing:0.3},
  sectionTitle:{fontSize:17,fontWeight:"700",color:C.text,letterSpacing:0.3},
  overlay:     {flex:1,backgroundColor:"rgba(0,0,0,0.75)",justifyContent:"center",alignItems:"center",padding:20},
  modal:       {backgroundColor:C.surface,borderWidth:1,borderColor:C.glassBorder,borderRadius:24,padding:24,width:"100%",gap:16},
  modalActions:{flexDirection:"row",gap:10,justifyContent:"flex-end"},
  btnPrimary:  {backgroundColor:C.primary,paddingHorizontal:20,paddingVertical:14,borderRadius:14,alignItems:"center"},
  btnPrimaryTxt:{color:C.bg,fontWeight:"800",fontSize:14,letterSpacing:0.5},
  btnGhost:    {paddingHorizontal:20,paddingVertical:14,borderRadius:14,alignItems:"center",borderWidth:1,borderColor:C.glassBorder},
});