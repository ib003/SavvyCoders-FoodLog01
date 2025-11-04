import React, { useState } from "react";

type DishInfo = {
    dishName: string;
    dishIngredients: string[];
    dishCalories: number;
    dateEaten: string;
    imageData?: string | null; // base64 string
    imageFilename?: string;
};


let dishName: string = "";
let dishIngredients: string[] = [];
let dishCalories: number = 0;
let dateEaten: string = "";
let imageData: string | null = null;
let imageFilename: string = "";


export function setDishInfo(
    nameInput: string,
    ingredientsInput: string[],
    caloriesInput: number,
    dateInput: string,
    imageInput?: string | null, 
    filenameInput: string = ""
) {
    dishName = nameInput;
    dishIngredients = ingredientsInput;
    dishCalories = caloriesInput;
    dateEaten = dateInput;
    imageFilename = filenameInput;
    imageData = imageInput ?? null;
}

export function getDishInfo(): DishInfo {
    return {
        dishName,
        dishIngredients,
        dishCalories,
        dateEaten,
        imageData,
        imageFilename,
    };
}

export function clearDishInfo() {
    dishName = "";
    dishIngredients = [];
    dishCalories = 0;
    dateEaten = "";
    imageData = null;
    imageFilename = "";
}

export function editDishInfo({
    nameInput,
    ingredientsInput,
    caloriesInput,
    dateInput,
    imageInput,
    filenameInput,
}: {
    nameInput?: string;
    ingredientsInput?: string[];
    caloriesInput?: number;
    dateInput?: string;
    imageInput?: string | null;
    filenameInput?: string;
}) {
    if (nameInput !== undefined) dishName = nameInput;
    if (ingredientsInput !== undefined) dishIngredients = ingredientsInput;
    if (caloriesInput !== undefined) dishCalories = caloriesInput;
    if (dateInput !== undefined) dateEaten = dateInput;
    if (filenameInput !== undefined) imageFilename = filenameInput;
    if (imageInput !== undefined) imageData = imageInput;
}
  
