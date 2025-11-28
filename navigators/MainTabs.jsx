// navigators/MainTabs.jsx

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AnimatedIcon from "../components/AnimatedIcon";

import HomeStackNavigator from "./HomeStackNavigator";
import FavoriteStackNavigator from "./FavoriteStackNavigator"; // ⭐️ IMPORT MỚI ⭐️
import MapScreen from "../screens/MapScreen";
import ChatBotScreen from "../screens/ChatBotScreen";
import ProfileStackNavigator from "./ProfileStackNavigator";

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="HomeStack"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 60,
          backgroundColor: "#fff",
          borderTopColor: "#eee",
          elevation: 10,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          // Lưu ý: route.name phải khớp với tên Tab.Screen bên dưới
          if (route.name === "HomeStack") iconName = focused ? "home" : "home-outline";
          else if (route.name === "FavoriteStack") iconName = focused ? "heart" : "heart-outline"; // Đổi tên route check
          else if (route.name === "Map") iconName = focused ? "map" : "map-outline";
          else if (route.name === "ChatBot") iconName = focused ? "chatbubbles" : "chatbubbles-outline";
          else if (route.name === "ProfileStack") iconName = focused ? "person" : "person-outline";

          return (
            <AnimatedIcon
              name={iconName}
              focused={focused}
              size={size}
              color={focused ? "#9f0b0bff" : "gray"}
            />
          );
        },
      })}
    >
      {/* ⭐️ ĐỔI component thành FavoriteStackNavigator và đặt tên là FavoriteStack ⭐️ */}
      <Tab.Screen name="FavoriteStack" component={FavoriteStackNavigator} />
      
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="HomeStack" component={HomeStackNavigator} />
      <Tab.Screen name="ChatBot" component={ChatBotScreen} />
      <Tab.Screen name="ProfileStack" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
}
