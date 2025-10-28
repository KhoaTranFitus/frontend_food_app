import React from 'react';
import { View, FlatList, TouchableOpacity, Text, StyleSheet } from 'react-native';
import RestaurantCard from '../components/RestaurantCard.jsx';
import { SafeAreaView } from 'react-native-safe-area-context';

const MOCK = Array.from({length:8}).map((_,i)=>({id:String(i+1), name:'Nhà hàng '+(i+1), rating:(4.0 - (i%2)*0.5).toFixed(1), price:(30+i*10)+'k'}));

export default function FoodScreen({navigation}) {
  return (
    <SafeAreaView style={{flex:1,backgroundColor:'#fff'}}>
      <View style={styles.header}><Text style={styles.title}>Danh sách Nhà hàng</Text></View>
      <FlatList data={MOCK} keyExtractor={i=>i.id} contentContainerStyle={{padding:12}} numColumns={2} renderItem={({item})=>(
        <TouchableOpacity onPress={()=>navigation.navigate('RestaurantDetail',{item})}>
          <RestaurantCard item={item} />
        </TouchableOpacity>
      )} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header:{padding:16,backgroundColor:'#fff'},
  title:{fontSize:20,fontWeight:'800',color:'#d3412a'}
});
