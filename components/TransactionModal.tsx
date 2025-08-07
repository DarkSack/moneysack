import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
  Dimensions,
} from "react-native";
import {
  X,
  ChevronDown,
  Calendar,
  Plus,
  Check,
  DollarSign,
  Tag,
} from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

const { height: screenHeight } = Dimensions.get("window");

export default function TransactionModal({
  isVisible,
  onClose,
  onSave,
  type,
  categories,
  onAddCategory,
}) {
  const [formData, setFormData] = useState({
    amount: 0,
    category: "",
    date: new Date(),
    description: "",
    target: "",
  });

  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isVisible) {
      setFormData({
        amount: 0,
        category: "",
        date: new Date(),
        description: "",
        target: "",
      });
      setErrors({});
      setShowNewCategoryInput(false);
      setNewCategory("");
      setShowCategoryDropdown(false);
    }
  }, [isVisible]);

  const getModalTitle = () => {
    switch (type) {
      case "income":
        return "Añadir Ingreso";
      case "expense":
        return "Añadir Egreso";
      case "goal":
        return "Nueva Meta";
      default:
        return "Añadir Transacción";
    }
  };

  const getModalColor = () => {
    switch (type) {
      case "income":
        return "bg-green-500 dark:bg-green-600";
      case "expense":
        return "bg-red-500 dark:bg-red-600";
      case "goal":
        return "bg-blue-500 dark:bg-blue-600";
      default:
        return "bg-gray-500 dark:bg-gray-600";
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (
      !formData.amount ||
      isNaN(formData.amount) ||
      parseFloat(formData.amount) <= 0
    ) {
      newErrors.amount = "Ingresa una cantidad válida";
    }

    if (!formData.category) {
      newErrors.category = "Selecciona una categoría";
    }

    if (
      type === "goal" &&
      (!formData.target ||
        isNaN(formData.target) ||
        parseFloat(formData.target) <= 0)
    ) {
      newErrors.target = "Ingresa una meta válida";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const transactionData = {
      ...formData,
      amount: parseFloat(formData.amount),
      target: formData.target ? parseFloat(formData.target) : null,
      type,
      id: Date.now(),
    };

    onSave(transactionData);
    onClose();
  };

  const handleAddNewCategory = () => {
    if (newCategory.trim()) {
      onAddCategory(newCategory.trim());
      setFormData({ ...formData, category: newCategory.trim() });
      setNewCategory("");
      setShowNewCategoryInput(false);
      setShowCategoryDropdown(false);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (event.type === "set" && selectedDate) {
      setFormData({ ...formData, date: selectedDate });
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return "";
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const handleScrollViewPress = () => {
    setShowCategoryDropdown(false);
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={{
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: screenHeight * 0.9,
            minHeight: screenHeight * 0.6,
          }}
          className="bg-white dark:bg-gray-900"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
            <View className="flex-row items-center">
              <View
                className={`w-10 h-10 ${getModalColor()} rounded-full items-center justify-center mr-3`}
              >
                <DollarSign size={20} color="white" />
              </View>
              <Text className="text-xl font-bold text-gray-900 dark:text-white">
                {getModalTitle()}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 items-center justify-center"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={24} className="text-gray-500 dark:text-gray-400" />
            </TouchableOpacity>
          </View>

          <ScrollView
            className="flex-1 p-6"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={handleScrollViewPress}
          >
            {/* Amount Input */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {type === "goal" ? "Monto Actual" : "Cantidad"} *
              </Text>
              <View className="relative">
                <TextInput
                  value={formData.amount}
                  onChangeText={(text) =>
                    setFormData({ ...formData, amount: text })
                  }
                  placeholder="0.00"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  className={`bg-gray-50 dark:bg-gray-800 border ${
                    errors.amount
                      ? "border-red-300 dark:border-red-500"
                      : "border-gray-200 dark:border-gray-600"
                  } rounded-xl px-4 py-4 text-lg font-semibold text-gray-900 dark:text-white pr-12`}
                  onFocus={() => setShowCategoryDropdown(false)}
                />
                <Text className="absolute right-4 top-4 text-lg font-semibold text-gray-500 dark:text-gray-400">
                  MXN
                </Text>
              </View>
              {errors.amount && (
                <Text className="text-red-500 dark:text-red-400 text-sm mt-1">
                  {errors.amount}
                </Text>
              )}
            </View>

            {/* Target Amount (solo para metas) */}
            {type === "goal" && (
              <View className="mb-6">
                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Meta a Alcanzar *
                </Text>
                <View className="relative">
                  <TextInput
                    value={formData.target}
                    onChangeText={(text) =>
                      setFormData({ ...formData, target: text })
                    }
                    placeholder="0.00"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                    className={`bg-gray-50 dark:bg-gray-800 border ${
                      errors.target
                        ? "border-red-300 dark:border-red-500"
                        : "border-gray-200 dark:border-gray-600"
                    } rounded-xl px-4 py-4 text-lg font-semibold text-gray-900 dark:text-white pr-12`}
                    onFocus={() => setShowCategoryDropdown(false)}
                  />
                  <Text className="absolute right-4 top-4 text-lg font-semibold text-gray-500 dark:text-gray-400">
                    MXN
                  </Text>
                </View>
                {errors.target && (
                  <Text className="text-red-500 dark:text-red-400 text-sm mt-1">
                    {errors.target}
                  </Text>
                )}
              </View>
            )}

            {/* Category Dropdown */}
            <View className="mb-6" style={{ zIndex: 1000 }}>
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Categoría *
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowCategoryDropdown(!showCategoryDropdown);
                  setShowNewCategoryInput(false);
                }}
                className={`bg-gray-50 dark:bg-gray-800 border ${
                  errors.category
                    ? "border-red-300 dark:border-red-500"
                    : "border-gray-200 dark:border-gray-600"
                } rounded-xl px-4 py-4 flex-row justify-between items-center`}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center flex-1">
                  <Tag size={20} className="text-gray-500 dark:text-gray-400" />
                  <Text
                    className={`ml-3 ${
                      formData.category
                        ? "text-gray-900 dark:text-white"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {formData.category || "Seleccionar categoría"}
                  </Text>
                </View>
                <ChevronDown
                  size={20}
                  className="text-gray-500 dark:text-gray-400"
                  style={{
                    transform: [
                      { rotate: showCategoryDropdown ? "180deg" : "0deg" },
                    ],
                  }}
                />
              </TouchableOpacity>

              {/* Dropdown Options */}
              {showCategoryDropdown && (
                <View
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl mt-2 shadow-lg"
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    zIndex: 1001,
                    elevation: 5,
                  }}
                >
                  <ScrollView
                    style={{ maxHeight: 200 }}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                  >
                    {categories.map((category, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => {
                          setFormData({ ...formData, category });
                          setShowCategoryDropdown(false);
                        }}
                        className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex-row items-center"
                        activeOpacity={0.7}
                      >
                        <Text className="text-gray-900 dark:text-white">
                          {category}
                        </Text>
                      </TouchableOpacity>
                    ))}

                    {/* Add New Category Option */}
                    <TouchableOpacity
                      onPress={() => {
                        setShowNewCategoryInput(true);
                        setShowCategoryDropdown(false);
                      }}
                      className="px-4 py-3 flex-row items-center bg-gray-50 dark:bg-gray-700"
                      activeOpacity={0.7}
                    >
                      <Plus size={20} color="#6366f1" />
                      <Text className="ml-2 text-indigo-600 dark:text-indigo-400 font-medium">
                        Añadir nueva categoría
                      </Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              )}

              {showNewCategoryInput && (
                <View className="mt-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nueva Categoría
                  </Text>
                  <View className="flex-row gap-2">
                    <TextInput
                      value={newCategory}
                      onChangeText={setNewCategory}
                      placeholder="Nombre de la categoría"
                      placeholderTextColor="#9ca3af"
                      className="flex-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                      autoFocus={true}
                    />
                    <TouchableOpacity
                      onPress={handleAddNewCategory}
                      className="bg-indigo-600 dark:bg-indigo-500 px-4 py-2 rounded-lg items-center justify-center"
                      activeOpacity={0.8}
                    >
                      <Check size={20} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setShowNewCategoryInput(false);
                        setNewCategory("");
                      }}
                      className="bg-gray-400 dark:bg-gray-600 px-4 py-2 rounded-lg items-center justify-center"
                      activeOpacity={0.8}
                    >
                      <X size={20} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {errors.category && (
                <Text className="text-red-500 dark:text-red-400 text-sm mt-1">
                  {errors.category}
                </Text>
              )}
            </View>

            {showCategoryDropdown && <View style={{ height: 220 }} />}

            {/* Date Picker */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowCategoryDropdown(false);
                  setShowDatePicker(true);
                }}
                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-4 flex-row items-center"
                activeOpacity={0.7}
              >
                <Calendar
                  size={20}
                  className="text-gray-500 dark:text-gray-400"
                />
                <Text className="ml-3 text-gray-900 dark:text-white">
                  {formatDate(formData.date)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Description Input */}
            <View className="mb-8">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descripción (opcional)
              </Text>
              <TextInput
                value={formData.description}
                onChangeText={(text) =>
                  setFormData({ ...formData, description: text })
                }
                placeholder={
                  type === "goal"
                    ? "Mi meta de ahorro..."
                    : "Descripción de la transacción..."
                }
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-4 text-gray-900 dark:text-white"
                textAlignVertical="top"
                onFocus={() => setShowCategoryDropdown(false)}
              />
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View className="flex-row gap-3 p-6 border-t border-gray-100 dark:border-gray-700">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 bg-gray-100 dark:bg-gray-700 py-4 rounded-xl"
              activeOpacity={0.8}
            >
              <Text className="text-center font-semibold text-gray-700 dark:text-gray-300">
                Cancelar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              className={`flex-1 ${getModalColor()} py-4 rounded-xl`}
              activeOpacity={0.8}
            >
              <Text className="text-center font-semibold text-white">
                Guardar
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={formData.date}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleDateChange}
          />
        )}
      </View>
    </Modal>
  );
}
