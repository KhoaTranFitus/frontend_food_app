import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import HomeStackNavigator from "./HomeStackNavigator";
import FavoriteScreen from "../screens/FavoriteScreen";
import MapScreen from "../screens/MapScreen";
import ChatBotScreen from "../screens/ChatBotScreen";
import SearchScreen from "../screens/SearchScreen";
import ProfileStackNavigator from "./ProfileStackNavigator";

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "HomeStack") iconName = focused ? "home" : "home-outline";
          else if (route.name === "Favorite") iconName = focused ? "heart" : "heart-outline";
          else if (route.name === "Map") iconName = focused ? "map" : "map-outline";
          else if (route.name === "ChatBot") iconName = focused ? "chatbubbles" : "chatbubbles-outline";
          else if (route.name === "ProfileStack") iconName = focused ? "person" : "person-outline";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#ff6347",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen
        name="HomeStack"
        component={HomeStackNavigator}
        options={{ title: "Home" }}
      />
      <Tab.Screen name="Favorite" component={FavoriteScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="ChatBot" component={ChatBotScreen} />
      <Tab.Screen name="Search" component ={SearchScreen} />
      <Tab.Screen
        name="ProfileStack"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
