import React from 'react';
import {TextInput, TextInputProps, StyleSheet} from 'react-native';
import Theme from '../../../core/theme/theme';

interface Props extends TextInputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
}

const CustomInput = ({
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  ...rest
}: Props) => {  return (
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor={Theme.colors.grey}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      {...rest}
    />
  );
};

export default CustomInput;

const styles = StyleSheet.create({
  input: {
    backgroundColor: Theme.colors.inputBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    paddingHorizontal: 15,
    height: 52,
    marginBottom: 15,
    color: Theme.colors.text,
    fontSize: 15,
  },
});
