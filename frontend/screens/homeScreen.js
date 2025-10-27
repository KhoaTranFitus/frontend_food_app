import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function HomeScreen({ navigation }) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Trang chủ</Text>

            <View style={styles.button}>
                <Button title="Đăng nhập" onPress={() => navigation.navigate('Login')} />
            </View>

            <View style={styles.button}>
                <Button title="Đăng ký" onPress={() => navigation.navigate('SignUp')} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 100,
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 40,
    },
    button: {
        width: '80%',
        marginVertical: 10,
    },
});
