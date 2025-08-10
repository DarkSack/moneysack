import { Goal, MinusCircle, Plus, PlusCircle } from "lucide-react-native";
import { useState } from "react";
import { Animated, TouchableOpacity, View } from "react-native";

export default function FloatingActionButton({
  onAddIncome,
  onAddExpense,
  onAddGoal,
}: {
  onAddIncome: () => void;
  onAddExpense: () => void;
  onAddGoal: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [animation] = useState(new Animated.Value(0));
  const [rotateAnimation] = useState(new Animated.Value(0));

  const toggleFAB = () => {
    const toValue = isExpanded ? 0 : 1;

    Animated.parallel([
      Animated.timing(animation, {
        toValue,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnimation, {
        toValue: isExpanded ? 0 : 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    setIsExpanded(!isExpanded);
  };

  const handleOptionPress = (action: string) => {
    toggleFAB();
    setTimeout(() => {
      if (action === "income" && onAddIncome) {
        onAddIncome();
      } else if (action === "expense" && onAddExpense) {
        onAddExpense();
      } else if (action === "goal" && onAddGoal) {
        onAddGoal();
      }
    }, 100);
  };

  const rotateIcon = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  const incomeTranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0],
  });

  const expenseTranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0],
  });

  const goalTranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0],
  });

  const optionScale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const optionOpacity = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <>
      {/* Overlay */}
      {isExpanded && (
        <TouchableOpacity
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            zIndex: 998,
          }}
          onPress={toggleFAB}
          activeOpacity={1}
        />
      )}
      <View
        style={{
          position: "absolute",
          bottom: 24,
          right: 24,
          zIndex: 999,
          alignItems: "center",
        }}
      >
        <Animated.View
          style={{
            transform: [{ translateY: goalTranslateY }, { scale: optionScale }],
            opacity: optionOpacity,
            marginBottom: 12,
          }}
        >
          <TouchableOpacity
            onPress={() => handleOptionPress("goal")}
            className="bg-indigo-500 dark:bg-indigo-600 rounded-full p-3 shadow-lg flex-row items-center"
            style={{
              elevation: 8,
              shadowColor: "#000",
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
          >
            <Goal size={24} color="white" />
          </TouchableOpacity>
        </Animated.View>
        <Animated.View
          style={{
            transform: [
              { translateY: expenseTranslateY },
              { scale: optionScale },
            ],
            opacity: optionOpacity,
            marginBottom: 12,
          }}
        >
          <TouchableOpacity
            onPress={() => handleOptionPress("expense")}
            className="bg-red-500 dark:bg-red-600 rounded-full p-3 shadow-lg flex-row items-center"
            style={{
              elevation: 8,
              shadowColor: "#000",
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
          >
            <MinusCircle size={24} color="white" />
          </TouchableOpacity>
        </Animated.View>
        <Animated.View
          style={{
            transform: [
              { translateY: incomeTranslateY },
              { scale: optionScale },
            ],
            opacity: optionOpacity,
            marginBottom: 12,
          }}
        >
          <TouchableOpacity
            onPress={() => handleOptionPress("income")}
            className="bg-green-500 dark:bg-green-600 rounded-full p-3 shadow-lg flex-row items-center"
            style={{
              elevation: 8,
              shadowColor: "#000",
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
          >
            <PlusCircle size={24} color="white" />
          </TouchableOpacity>
        </Animated.View>

        {/* Main FAB Button */}
        <TouchableOpacity
          onPress={toggleFAB}
          className="bg-blue-600 dark:bg-blue-700 rounded-full p-4 shadow-lg"
          style={{
            width: 64,
            height: 64,
            justifyContent: "center",
            alignItems: "center",
            elevation: 8,
            shadowColor: "#000",
            shadowOpacity: 0.3,
            shadowRadius: 8,
          }}
        >
          <Animated.View
            style={{
              transform: [{ rotate: rotateIcon }],
            }}
          >
            <Plus size={28} color="white" />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </>
  );
}
