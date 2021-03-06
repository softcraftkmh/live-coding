import React, {
    ChangeEvent,
    FC,
    SyntheticEvent,
    useCallback,
    useEffect,
} from "react"
import {
    formatCardExpiry,
    formatCardNumber,
    parseCardExpiry,
    parseCardType,
    validateCardCVC,
    validateCardExpiry,
    validateCardNumber,
} from "creditcardutils"
import Joi from "joi"

import useValidator from "@packages/react-joi"
import useModels from "@packages/react-use-models"

// Svg Icons
import IconVisa from "@components/svgs/visa.svg"
import IconMastercard from "@components/svgs/mastercard.svg"

// Styled Elements
import {
    Actions,
    CardImage,
    CardImageGroup,
    Container,
    ErrorMessage,
    FieldControl,
    FieldGroups,
    FieldLabel,
    Fields,
    FieldsMerge,
    Form,
    Input,
    Submit,
} from "./index.styled"

type TypeCheckoutFormDefaultValues = {
    email: string | null
    card_number: string | null
    card_expire: string | null
    cvv: string | null
}

export type TypeCheckoutFormValues = NonNullable<TypeCheckoutFormDefaultValues>

export interface CheckoutFormProps {
    onSuccess: (values: TypeCheckoutFormValues) => void
    loading?: boolean
    submitText?: string
}

const defaultState: TypeCheckoutFormDefaultValues = {
    email: null,
    card_number: null,
    card_expire: null,
    cvv: null,
}

const CheckoutForm: FC<CheckoutFormProps> = ({
    onSuccess,
    loading = false,
    submitText = "Submit",
}) => {
    const { models, register, updateModel } =
        useModels<TypeCheckoutFormDefaultValues>({
            defaultState,
        })
    const { state, setData } = useValidator({
        initialData: defaultState,
        schema: Joi.object({
            email: Joi.string()
                .email({
                    tlds: { allow: false },
                })
                .required()
                .messages({
                    "string.empty": "Required",
                    "string.email": "Must be a valid email",
                    "any.required": "Required",
                }),
            card_number: Joi.string()
                .custom((value, helpers) => {
                    if (value) {
                        if (!validateCardNumber(value)) {
                            return helpers.error("string.cardNumber")
                        }
                    }
                    return value
                })
                .custom((value, helpers) => {
                    if (value) {
                        const cardType = parseCardType(value)
                        if (
                            !(cardType === "visa" || cardType === "mastercard")
                        ) {
                            return helpers.error("string.cardType")
                        }
                        return value
                    }
                })
                .required()
                .messages({
                    "string.empty": "Required",
                    "string.cardNumber": "Must be a valid card",
                    "string.cardType": "Must be Visa / Master card type",
                    "any.required": "Required",
                }),
            card_expire: Joi.string()
                .custom((value, helpers) => {
                    if (value) {
                        const { month, year } = parseCardExpiry(value)
                        if (!validateCardExpiry(month, year)) {
                            return helpers.error("string.cardExpire")
                        }
                    }
                    return value
                })
                .required()
                .messages({
                    "string.empty": "Required",
                    "string.cardExpire": "Must be valid expiration date",
                    "any.required": "Required",
                }),
            cvv: Joi.string()
                .length(3)
                .required()
                .custom((value, helpers) => {
                    if (value) {
                        if (!validateCardCVC(value)) {
                            return helpers.error("string.invalid")
                        }
                    }
                    return value
                })
                .messages({
                    "string.empty": "Required",
                    "string.invalid": "Must be valid CVV",
                    "string.length": "Maximum 3 digits",
                    "any.required": "Required",
                }),
        }),
    })

    const getErrors = useCallback(
        (field) => {
            return state.$errors[field]
                .map((data: any) => data.$message)
                .join(",")
        },
        [state.$errors]
    )

    const onSubmit = (e: SyntheticEvent) => {
        e.preventDefault()

        onSuccess(state.$data)
    }

    const formatter = {
        cardNumber: (e: ChangeEvent<HTMLInputElement>) => {
            const value = formatCardNumber(e.target.value)

            updateModel("card_number", value)
        },
        cardExpire: (e: ChangeEvent<HTMLInputElement>) => {
            const value = formatCardExpiry(e.target.value)

            updateModel("card_expire", value)
        },
    }

    // Sync model <-> validator
    useEffect(() => {
        setData(models)
    }, [models])

    return (
        <Container>
            <Form onSubmit={onSubmit}>
                <Fields>
                    <FieldControl>
                        <FieldLabel error={!!getErrors("email")}>
                            Email
                        </FieldLabel>

                        <Input
                            {...register.input({ name: "email" })}
                            type="email"
                            placeholder="you@company.com"
                            autoComplete="current-email"
                        />
                    </FieldControl>

                    {getErrors("email") && (
                        <ErrorMessage>{getErrors("email")}</ErrorMessage>
                    )}
                </Fields>

                <FieldGroups>
                    <Fields>
                        <FieldControl>
                            <FieldLabel error={!!getErrors("card_number")}>
                                Card information
                            </FieldLabel>

                            <Input
                                {...register.input({
                                    name: "card_number",
                                    onChange: formatter.cardNumber,
                                })}
                                type="text"
                                placeholder="1234 1234 1234 1234"
                            />
                            <CardImageGroup>
                                <CardImage
                                    src={IconVisa}
                                    active={
                                        parseCardType(models.card_number) ===
                                        "visa"
                                    }
                                />
                                <CardImage
                                    src={IconMastercard}
                                    active={
                                        parseCardType(models.card_number) ===
                                        "mastercard"
                                    }
                                />
                            </CardImageGroup>
                        </FieldControl>

                        {getErrors("card_number") && (
                            <ErrorMessage>
                                {getErrors("card_number")}
                            </ErrorMessage>
                        )}
                    </Fields>

                    <FieldsMerge>
                        <Fields>
                            <Input
                                {...register.input({
                                    name: "card_expire",
                                    onChange: formatter.cardExpire,
                                })}
                                type="text"
                                placeholder="MM / YY"
                            />

                            {getErrors("card_expire") && (
                                <ErrorMessage>
                                    {getErrors("card_expire")}
                                </ErrorMessage>
                            )}
                        </Fields>

                        <Fields>
                            <Input
                                {...register.input({ name: "cvv" })}
                                type="number"
                                placeholder="123"
                                maxLength={3}
                            />

                            {getErrors("cvv") && (
                                <ErrorMessage>{getErrors("cvv")}</ErrorMessage>
                            )}
                        </Fields>
                    </FieldsMerge>
                </FieldGroups>

                <Actions>
                    <Submit disabled={state.$auto_invalid || loading}>
                        {submitText}
                    </Submit>
                </Actions>
            </Form>
        </Container>
    )
}

export default CheckoutForm
