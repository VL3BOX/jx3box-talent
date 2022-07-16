#buff表

<BUFF atMaxLifeAdditional>
<BUFF atVitalityBase>
<BUFF atPhysicsShieldBase>
<BUFF atPhysicsAttackPowerBase>
<BUFF atSpunkBase>
<BUFF atMagicAttackPowerBase>

<Skill 5798 0 4%>

#skill表
1.<TALENT 16857 1 受到伤害导致自身气血值低于40%，立刻重置“太阴指”“星楼月影”调息时间，该效果最多60秒触发一次> 
<TALENT .*? > 附加奇穴效果，可过滤

2.<EnchantID 10080 玉石俱焚每吞噬一跳属于自身的持续伤害效果，使下一招阳明指额外造成10%的伤害。>
<EnchantID .*? > 强化，可过滤

3.<BUFF 631 0 desc>
<BUFF $id n desc> buff描述

?4.<BUFF 631 0 time>
<BUFF $id n time> buff持续时间
interval1 * count

5.(+<SKILLEx {D0} {TotalTherapyAP 0.11}>)
(+<SKILLEx .*?>) 根据自身属性额外提升值，可过滤

6.<SKILL NeutralDamage> <SKILL SolarDamage> <SKILL PoisonDamage>
<SKILL .*?> lua表中的基础伤害，可过滤

7.<SUB 775 2>
<SUB $id $level> 同表技能