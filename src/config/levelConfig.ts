export interface LevelConfig {
    level: number;
    ops: string[];          // Allowed operators ['+', '-', '*', '/']
    minVal: number;         // Minimum tile number
    maxVal: number;         // Maximum tile number
    targetScore: number;    // Score needed to pass the level
    requiredOps?: Record<string, number>; // Quests: { '-': 3 } means must use minus 3 times
    minScoreToPass: number; // 1 Star threshold
    description: string;    // "Addition Basics", "Intro to Subtraction"
    threeStarSeconds: number; // Time threshold for 3 stars (Gold)
    twoStarSeconds: number;   // Time threshold for 2 stars (Silver)
}

export const getLevelConfig = (level: number): LevelConfig => {
    // defaults
    let ops = ['+'];
    let minVal = 1;
    let maxVal = 5;
    let targetScore = 120;
    let description = "FIND THE SUM";
    let requiredOps: Record<string, number> = {};
    let threeStarSeconds = 60;
    let twoStarSeconds = 90;

    // --- LEVEL MATRIX (1-15) ---
    if (level === 1) {
        // Tutorial: Pairs
        ops = ['+'];
        maxVal = 5;
        targetScore = 120;
        threeStarSeconds = 60; twoStarSeconds = 90;
        description = "TUTORIAL: PAIRS";
    }
    else if (level === 2) {
        // Practice
        ops = ['+'];
        maxVal = 7;
        targetScore = 250;
        threeStarSeconds = 45; twoStarSeconds = 70;
        description = "ADDITION PRACTICE";
    }
    else if (level <= 3) {
        // Intro to Subtraction
        ops = ['+', '-'];
        maxVal = 8;
        targetScore = 300;
        requiredOps = { '-': 1 }; // Quest
        threeStarSeconds = 60; twoStarSeconds = 90;
        description = "INTRO TO SUBTRACTION";
    }
    else if (level <= 5) {
        // Mastering Subtraction & Speed
        ops = ['+', '-'];
        maxVal = 10;
        if (level === 4) {
            targetScore = 400;
            requiredOps = { '-': 3 };
            description = "SUBTRACTION MASTERY";
            threeStarSeconds = 75; twoStarSeconds = 110;
        } else {
            targetScore = 500;
            requiredOps = { '+': 5 };
            description = "ADDITION SPEED";
            threeStarSeconds = 90; twoStarSeconds = 135;
        }
    }
    else if (level === 6) {
        // Mixed Ops Check
        ops = ['+', '-'];
        maxVal = 12;
        targetScore = 600;
        requiredOps = { '+': 3, '-': 2 };
        description = "MIXED OPS CHECK";
        threeStarSeconds = 100; twoStarSeconds = 150;
    }
    else if (level === 7) {
        // Intro to Multiplication
        ops = ['+', '-', '×'];
        maxVal = 12;
        targetScore = 800;
        requiredOps = { '×': 1 };
        description = "INTRO TO MULTIPLICATION";
        threeStarSeconds = 120; twoStarSeconds = 180;
    }
    else if (level <= 9) {
        // Multiplication & Complex
        ops = ['+', '-', '×'];
        maxVal = 15;
        if (level === 8) {
            targetScore = 900;
            requiredOps = { '×': 3 };
            description = "MULTIPLICATION PRACTICE";
            threeStarSeconds = 130; twoStarSeconds = 195;
        } else {
            targetScore = 1000;
            requiredOps = { '-': 3, '×': 2 };
            description = "COMPLEX SEQUENCING";
            threeStarSeconds = 140; twoStarSeconds = 210;
        }
    }
    else if (level === 10) {
        // Intro to Division
        ops = ['+', '-', '×', '÷'];
        maxVal = 20;
        targetScore = 1200;
        requiredOps = { '÷': 1 };
        description = "INTRO TO DIVISION";
        threeStarSeconds = 150; twoStarSeconds = 225;
    }
    else if (level <= 15) {
        ops = ['+', '-', '×', '÷'];
        maxVal = 20 + (level - 10);
        targetScore = 1200 + ((level - 10) * 200);

        if (level === 11) { requiredOps = { '÷': 3 }; description = "DIVISION PRACTICE"; }
        else if (level === 12) { requiredOps = { '×': 2, '÷': 2 }; description = "ADVANCED OPS"; }
        else if (level === 15) { requiredOps = { '+': 2, '-': 2, '×': 2, '÷': 2 }; description = "BOSS LEVEL"; }
        else { requiredOps = { '+': 5 }; description = "ENDURANCE"; }

        threeStarSeconds = 150 + ((level - 10) * 20);
        twoStarSeconds = Math.floor(threeStarSeconds * 1.5);
    }
    else {
        // Procedural for 16+
        ops = ['+', '-', '×', '÷'];
        maxVal = Math.min(99, 30 + (level - 15));
        targetScore = 2000 + ((level - 15) * 250);
        requiredOps = { '+': Math.min(10, Math.floor(level / 5)) }; // Generic quest
        description = "THE GRIND";
        threeStarSeconds = Math.floor(targetScore / 10);
        twoStarSeconds = Math.floor(threeStarSeconds * 1.5);
    }

    const minScoreToPass = Math.floor(targetScore * 0.6);

    return {
        level,
        ops,
        minVal,
        maxVal,
        targetScore,
        minScoreToPass,
        description,
        requiredOps,
        threeStarSeconds,
        twoStarSeconds
    };
};
