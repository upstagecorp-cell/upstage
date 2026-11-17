import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '@/components/nexora/ui';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottom = Platform.OS === 'web' ? 9 : Math.max(insets.bottom, 8);
  return <Tabs screenOptions={{headerShown:false, tabBarActiveTintColor:C.green, tabBarInactiveTintColor:'#839086', tabBarLabelStyle:{fontSize:10,fontWeight:'700',paddingBottom:2}, tabBarStyle:{height:59+bottom,paddingBottom:bottom,paddingTop:7,backgroundColor:'#fff',borderTopColor:C.border}}}>
    <Tabs.Screen name="index" options={{title:'Home',tabBarIcon:({color,focused})=><Ionicons name={focused?'home':'home-outline'} size={22} color={color}/>}} />
    <Tabs.Screen name="plan" options={{title:'Plan',tabBarIcon:({color,focused})=><Ionicons name={focused?'calendar':'calendar-outline'} size={22} color={color}/>}} />
    <Tabs.Screen name="create" options={{title:'Create',tabBarIcon:({color,focused})=><Ionicons name={focused?'sparkles':'sparkles-outline'} size={22} color={color}/>}} />
    <Tabs.Screen name="results" options={{title:'Results',tabBarIcon:({color,focused})=><Ionicons name={focused?'bar-chart':'bar-chart-outline'} size={22} color={color}/>}} />
    <Tabs.Screen name="account" options={{title:'Account',tabBarIcon:({color,focused})=><Ionicons name={focused?'person-circle':'person-circle-outline'} size={22} color={color}/>}} />
  </Tabs>;
}
