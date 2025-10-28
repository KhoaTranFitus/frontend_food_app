import React, {useState, useEffect} from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { searchAddress } from '../services/tomtomApi.jsx';

export default function SearchScreen({navigation}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [userLoc, setUserLoc] = useState(null);

  useEffect(()=>{
    (async ()=>{
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let loc = await Location.getCurrentPositionAsync({accuracy: Location.Accuracy.High});
      setUserLoc({latitude: loc.coords.latitude, longitude: loc.coords.longitude});
    })();
  },[]);

  const handleSearch = async ()=>{
    const res = await searchAddress(query);
    setResults(res || []);
  };

  return (
    <SafeAreaView style={{flex:1}}>
      <View style={{padding:12}}>
        <TextInput placeholder="Tìm nhà hàng, ẩm thực..." value={query} onChangeText={setQuery} style={styles.input} />
        <TouchableOpacity style={styles.btn} onPress={handleSearch}><Text style={{color:'#fff'}}>Tìm</Text></TouchableOpacity>
      </View>
      <MapView style={{flex:1}} initialRegion={{latitude:userLoc?.latitude||10.776530, longitude:userLoc?.longitude||106.700981, latitudeDelta:0.08, longitudeDelta:0.08}}>
        {userLoc && <Marker coordinate={userLoc} title="Bạn" />}
        {results.map((r, idx)=>(<Marker key={idx} coordinate={{latitude:r.position.lat, longitude:r.position.lon}} title={r.poi?.name || r.address.freeformAddress} />))}
      </MapView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  input:{backgroundColor:'#fff',padding:12,borderRadius:10,marginBottom:8,elevation:2},
  btn:{backgroundColor:'#d32f2f',padding:12,alignItems:'center',borderRadius:10}
});
