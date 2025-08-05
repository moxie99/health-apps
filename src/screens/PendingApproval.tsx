/* eslint-disable react-hooks/exhaustive-deps */
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import React, { useEffect } from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { useGetProfile } from '../api/driverApi';

type PendingScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Login'
>;

interface Props {
  navigation: PendingScreenNavigationProp;
}
const PendingApproval: React.FC<Props> = ({ navigation }) => {
  const { data: driver, refetch } = useGetProfile();
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
      if (driver?.data?.status === 'approved') {
        navigation.navigate('MainTabs');
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [driver, refetch]);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Awaiting Approval</Text>
      <Text style={styles.message}>
        Your account is pending admin approval. You will be redirected to the
        dashboard once approved.
      </Text>
      <ActivityIndicator size="large" color="#0000ff" />
    </View>
  );
};

export default PendingApproval;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  message: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
});
