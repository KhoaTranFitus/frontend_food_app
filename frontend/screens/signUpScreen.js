import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function SignUpScreen({ navigation }) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Màn hình Đăng ký</Text>
            <Button title="Quay về Trang chủ" onPress={() => navigation.goBack()} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 100,
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        marginBottom: 20,
    },
});
