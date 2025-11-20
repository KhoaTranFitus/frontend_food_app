import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import HomeScreen from "../screens/HomeScreen";
import RestaurantDetailScreen from "../screens/RestaurantDetailScreen";
import SearchScreen from "../screens/SearchScreen";
import FoodDetailScreen from "../screens/FoodDetailScreen";
import AllRestaurantsScreen from "../screens/AllRestaurantsScreen";
import AllCategoriesScreen from "../screens/AllCategoriesScreen";


const Stack = createStackNavigator();

export default function HomeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="FoodDetail" component={FoodDetailScreen} />
      <Stack.Screen name="AllRestaurants" component={AllRestaurantsScreen} />
      <Stack.Screen name="AllCategories" component={AllCategoriesScreen} />
    </Stack.Navigator>
  );
}
